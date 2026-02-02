import process from 'node:process';

import {
    deleteAccountUserAccountByEmailAddress,
    getAccountsPage,
    getUserAccountByEmailAddress,
    patchAccount,
    postAccount,
    postAccountPostalAddress,
    postAccountUserAccountByEmailAddress,
    PostalAddress,
    postUserAccount,
} from 'liferay-headless-rest-client/headless-admin-user-v1.0';

import {
    getRegionsPage,
    getCountriesPage,
    Region,
    Country,
} from 'liferay-headless-rest-client/headless-admin-address-v1.0';

import { Account, KoroneikiAccount, KoroneikiContact } from './types';

import { koroneikiApi } from '../../services/koroneikiApi';
import { liferayClient } from '../../services/liferay';
import { logger } from '../../utils/logger';
import { path, paths } from '../../utils/paths';
import PaginationRun from '../../core/PaginationRun';
import { isEmailAddressValid } from '../../utils/validators';
import { SearchBuilder } from 'odata-search-builder';
import Cache from '../../utils/cache';

type AccountWithUserAccount = Account & {
    accountUserAccounts: any[];
    postalAddresses: PostalAddress[];
};

const cacheInstance = Cache.getInstance();

const { data } = await getCountriesPage({
    client: liferayClient,
    query: { pageSize: '-1' },
});

const countriesRegionMap = new Map<string, string[]>(
    (data?.items as Country[]).map(({ name, regions }) => [
        name,
        regions?.map(({ name }) => name) as string[],
    ]),
);

class KoroneikAccountSync {
    constructor() {
        this.gracefullyShutdown();
    }

    gracefullyShutdown() {
        function handleShutdown(signal: string) {
            logger.info(
                `[SHUTDOWN] Received ${signal} signal - performing graceful shutdown`,
            );

            // You can add your cache listing logic here
            logger.info(
                `[SHUTDOWN] Cache contains ${cacheInstance.cache.size} items`,
            );
            console.log(cacheInstance.cache.keys());

            logger.info('[SHUTDOWN] Exiting gracefully');
            process.exit(0);
        }

        process.on('SIGINT', () => handleShutdown('SIGINT'));
        process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    }

    dynamicLog(description: string, error: unknown) {
        if (error) {
            return logger.error(
                `${description}, error: ${JSON.stringify(error)}`,
            );
        }

        logger.info(description);
    }

    async getFileEntryValues<T>(filePath: string, defaultValue: T) {
        try {
            return Bun.file(filePath).json() as T;
        } catch {
            return defaultValue;
        }
    }

    async getDXPAccounts() {
        logger.info('[getDXPAccounts] start processing');

        const paginationRun = new PaginationRun();

        const items = [] as Account[];

        await paginationRun.dryRun(
            {
                fetchData: (page, pageSize) =>
                    getAccountsPage({
                        client: liferayClient,
                        query: {
                            nestedFields: 'accountUserAccounts,postalAddresses',
                            page: page.toString(),
                            pageSize: pageSize.toString(),
                        },
                    }).then((response) => response.data),
                name: 'getDXPAccounts',
                processItem: async (item) => {
                    const account = item as Account & {
                        accountUserAccounts: any[];
                        postalAddresses: PostalAddress;
                    };

                    items.push({
                        description: account.description,
                        externalReferenceCode: account.externalReferenceCode,
                        id: account.id,
                        name: account.name,
                        type: account.type,
                        postalAddresses: account.postalAddresses,
                        accountUserAccounts: account.accountUserAccounts.map(
                            ({ emailAddress, familyName, givenName }) => ({
                                emailAddress,
                                familyName,
                                givenName,
                            }),
                        ),
                    } as unknown as AccountWithUserAccount);
                },
            },
            { page: 1, pageSize: 100 },
        );

        logger.info('[getDXPAccounts] writing file');

        await Bun.write(
            path.join(paths.json, 'dxp-accounts.json'),
            JSON.stringify(items, null, 2),
        );
    }

    async getKoroneikiAccounts() {
        logger.info('[getKoroneikiAccounts] start processing');

        const paginationRun = new PaginationRun();

        const items: KoroneikiAccount[] = [];

        await paginationRun.dryRun(
            {
                fetchData: (page, pageSize) =>
                    koroneikiApi.getKoroneikiAccounts(
                        new URLSearchParams({
                            filter:
                                "entitlements/any(s:contains(s, 'Subscription') or s eq 'Partner') " +
                                new SearchBuilder()
                                    .and()
                                    .not()
                                    .startswith('name', 'OSB Playwright')
                                    .build(),
                            nestedFields: 'workerContacts',
                            page: `${page}`,
                            pageSize: `${pageSize}`,
                        }),
                    ),
                name: 'getKoroneikiAccounts',
                processItem: async (item: any) => {
                    const koroneikiAccount = item as KoroneikiAccount;

                    let postalAddresses = item?.postalAddresses
                        ? [...item.postalAddresses]
                        : [];

                    if (!postalAddresses.length) {
                        const addressResponse =
                            await koroneikiApi.getKoroneikiPostalAddress(
                                item.key,
                            );

                        postalAddresses = addressResponse.items;
                    }

                    items.push({
                        contactEmailAddress:
                            koroneikiAccount.contactEmailAddress,
                        description: koroneikiAccount.description,
                        externalReferenceCode: koroneikiAccount.key,
                        key: koroneikiAccount.key,
                        name: koroneikiAccount.name,
                        parentAccountKey: koroneikiAccount.parentAccountKey,
                        postalAddresses,
                        type: 'business',
                    } as KoroneikiAccount);
                },
            },
            { page: 1, pageSize: 50 },
        );

        logger.info('[getKoroneikiAccounts] writing file');

        await Bun.write(
            path.join(paths.json, 'koroneiki-accounts.json'),
            JSON.stringify(items, null, 2),
        );

        return items;
    }

    async getUserAccountByEmailAddress(emailAddress: string) {
        const key = `emailAddress:${emailAddress}`;

        if (cacheInstance.has(key)) {
            return cacheInstance.get(key);
        }

        const { data } = await getUserAccountByEmailAddress({
            client: liferayClient,
            path: {
                emailAddress,
            },
        });

        if (data) {
            cacheInstance.set(key, data);
        }

        return data;
    }

    /**
     * Get Koroneiki account contacts by account key
     * @param accountKey
     * @returns Koroneiki account contacts
     */
    async getKoroneikiAccountContact(accountKey: string) {
        const key = `accountContacts:${accountKey}`;

        if (cacheInstance.has(key)) {
            return cacheInstance.get(key);
        }

        const response =
            await koroneikiApi.getKoroneikiAccountContacts(accountKey);

        cacheInstance.set(key, response);

        return response;
    }

    async getKoroneikiAccountContacts(accountKeys: string[]) {
        const promises = await Promise.all(
            accountKeys.map((accountKey) =>
                this.getKoroneikiAccountContact(accountKey),
            ),
        );

        const items: KoroneikiContact[] = [];

        for (const promise of promises) {
            items.push(...promise.items);
        }

        return items;
    }

    async syncKoroneikiAccountMembers(
        liferayAccount: AccountWithUserAccount,
        koroneikiAccount: KoroneikiAccount,
    ) {
        const koroneikiContacts = await this.getKoroneikiAccountContacts(
            koroneikiAccount.parentAccountKey
                ? [koroneikiAccount.key, koroneikiAccount.parentAccountKey]
                : [koroneikiAccount.key],
        );

        const liferayAccountsToUnassociate =
            liferayAccount?.accountUserAccounts.filter(
                ({ emailAddress }) =>
                    !koroneikiContacts.find(
                        ({ emailAddress: koroneikiEmailAddress }) =>
                            koroneikiEmailAddress === emailAddress,
                    ),
            );

        for (const koroneikiContact of koroneikiContacts) {
            const emailAddress = koroneikiContact.emailAddress;

            if (!isEmailAddressValid(emailAddress)) {
                logger.warn(
                    `[syncKoroneikiAccountMembers] Skipping invalid email address ${emailAddress}`,
                );

                continue;
            }

            const liferayUserAccount =
                liferayAccount?.accountUserAccounts?.find(
                    (userAccount) => userAccount.emailAddress === emailAddress,
                );

            if (liferayUserAccount) {
                logger.info(
                    `[syncKoroneikiAccountMembers] "${emailAddress}" is already linked to account`,
                );

                continue;
            }

            let userAccount =
                await this.getUserAccountByEmailAddress(emailAddress);

            if (!userAccount) {
                const { data, error } = await postUserAccount({
                    body: {
                        emailAddress,
                        familyName: koroneikiContact.lastName,
                        givenName: koroneikiContact.firstName,
                    },
                    client: liferayClient,
                });

                if (data && !error) {
                    cacheInstance.set(`emailAddress:${emailAddress}`, data);
                }

                this.dynamicLog(
                    `[syncKoroneikiAccountMembers] "${emailAddress}" post user account`,
                    error,
                );
            }

            const { error } = await postAccountUserAccountByEmailAddress({
                client: liferayClient,
                path: {
                    accountId: String(liferayAccount.id),
                    emailAddress,
                },
            });

            this.dynamicLog(
                `[syncKoroneikiAccountMembers] "${emailAddress}" linked used to account`,
                error,
            );
        }

        for (const { emailAddress } of liferayAccountsToUnassociate) {
            const { error } = await deleteAccountUserAccountByEmailAddress({
                client: liferayClient,
                path: {
                    accountId: String(liferayAccount.id),
                    emailAddress: emailAddress,
                },
            });

            this.dynamicLog(
                `[syncKoroneikiAccountMembers] "${emailAddress}" unlinked from account`,
                error,
            );
        }
    }

    async syncLiferayAccount(
        liferayAccount: Account | undefined,
        koroneikiAccount: KoroneikiAccount,
    ) {
        if (!liferayAccount) {
            const { data, error } = await postAccount({
                body: {
                    customFields: koroneikiAccount.parentAccountKey
                        ? [
                              {
                                  name: 'parent-koroneiki-account-key',
                                  customValue: {
                                      data: koroneikiAccount.parentAccountKey,
                                  } as any,
                              },
                          ]
                        : undefined,
                    externalReferenceCode: koroneikiAccount.key,
                    name: koroneikiAccount.name,
                },
                client: liferayClient,
                query: { nestedFields: 'accountUserAccounts' } as any,
            });

            this.dynamicLog(
                `[syncLiferayAccount] post account "${koroneikiAccount.name}"`,
                error,
            );

            return data as Account;
        }

        if (
            liferayAccount.description === koroneikiAccount.description &&
            liferayAccount.name === koroneikiAccount.name
        ) {
            logger.info('[syncLiferayAccount] skip patch account');

            return liferayAccount;
        }

        const { error } = await patchAccount({
            body: {
                externalReferenceCode: koroneikiAccount.key,
                description: koroneikiAccount.description,
                name: koroneikiAccount.name,
            },
            client: liferayClient,
            path: { accountId: `${liferayAccount.id}` },
        });

        this.dynamicLog(`[syncLiferayAccount] patch account`, error);

        return liferayAccount;
    }

    async syncAccountAddress(
        liferayAccount: AccountWithUserAccount,
        koroneikiAccount: KoroneikiAccount,
    ) {
        for (const koroneikiPostalAddress of koroneikiAccount.postalAddresses) {
            const liferayAccountAddress = liferayAccount.postalAddresses?.find(
                ({ streetAddressLine1 }) =>
                    streetAddressLine1 ===
                    koroneikiPostalAddress.streetAddressLine1,
            );

            if (liferayAccountAddress) {
                logger.info(
                    `[syncAccountAddress] address ${liferayAccountAddress.streetAddressLine1} already exist`,
                );

                continue;
            }

            let addressRegion;

            if (!addressRegion) {
                addressRegion = countriesRegionMap.get(
                    koroneikiPostalAddress.addressCountry
                        .toLowerCase()
                        .replace(' ', '-'),
                )?.[0];

                logger.info(
                    '[syncAccountAddress] using fallback region ' +
                        addressRegion,
                );
            }

            const { error } = await postAccountPostalAddress({
                body: {
                    addressCountry: koroneikiPostalAddress.addressCountry,
                    addressLocality: koroneikiPostalAddress.addressLocality,
                    postalCode: koroneikiPostalAddress.postalCode,
                    streetAddressLine1:
                        koroneikiPostalAddress.streetAddressLine1,
                    streetAddressLine2:
                        koroneikiPostalAddress.streetAddressLine2,
                    streetAddressLine3:
                        koroneikiPostalAddress.streetAddressLine3,
                    addressType: 'billing-and-shipping',
                    addressRegion: addressRegion,
                    primary: koroneikiPostalAddress.primary,
                },
                client: liferayClient,
                path: { accountId: liferayAccount.id.toString() },
            });

            if (error) {
                logger.error(
                    '[syncAccountAddress] Failed to post account with region ' +
                        JSON.stringify(koroneikiPostalAddress),
                );
            }

            this.dynamicLog(
                `[syncAccountAddress] address synced region: ${addressRegion}`,
                error,
            );
        }
    }

    async main() {
        logger.warn(`[main] start processing`);

        const dxpAccounts = await this.getFileEntryValues<Account[]>(
            path.join(paths.json, 'dxp-accounts.json'),
            [],
        );

        const koroneikiAccounts = await this.getFileEntryValues<
            KoroneikiAccount[]
        >(path.join(paths.json, 'koroneiki-accounts.json'), []);

        const dxpAccountsMap = new Map<string, Account>(
            dxpAccounts.map((account) => [
                account.externalReferenceCode,
                account,
            ]),
        );

        let i = 1;

        for (const koroneikiAccount of koroneikiAccounts) {
            let liferayAccount = dxpAccountsMap.get(
                koroneikiAccount.externalReferenceCode,
            );

            logger.info('\n');
            logger.info(
                `[main:start] ============================= "${koroneikiAccount.name}" =============================`,
            );
            logger.info(
                `[main:start] - Koroneiki Account ${i}/${koroneikiAccounts.length}`,
            );

            liferayAccount = await this.syncLiferayAccount(
                liferayAccount,
                koroneikiAccount,
            );

            if (!liferayAccount) {
                logger.info('[main] Liferay account not exist');

                continue;
            }

            for (const sync of [
                this.syncAccountAddress,
                this.syncKoroneikiAccountMembers,
            ]) {
                await sync.call(
                    this,
                    liferayAccount as AccountWithUserAccount,
                    koroneikiAccount,
                );
            }

            i++;
        }
    }
}

const koroneikAccountSync = new KoroneikAccountSync();

await koroneikAccountSync.getDXPAccounts();
await koroneikAccountSync.getKoroneikiAccounts();
await koroneikAccountSync.main();
