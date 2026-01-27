import {
    getAccountsPage,
    getUserAccountByEmailAddress,
    patchAccount,
    postAccount,
    postAccountUserAccountByEmailAddress,
    postUserAccount,
} from 'liferay-headless-rest-client/headless-admin-user-v1.0';

import { Account, KoroneikiAccount } from './types';

import { koroneikiApi } from '../../services/koroneikiApi';
import { liferayClient } from '../../services/liferay';
import { logger } from '../../utils/logger';
import { path, paths } from '../../utils/paths';
import PaginationRun from '../../core/PaginationRun';
import { isEmailAddressValid } from '../../utils/validators';
import { SearchBuilder } from 'odata-search-builder';
import Cache from '../../utils/cache';

type AccountWithUserAccount = Account & { accountUserAccounts: any[] };

const cache = Cache.getInstance();

class KoroneikAccountSync {
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
                    };

                    items.push({
                        description: account.description,
                        externalReferenceCode: account.externalReferenceCode,
                        id: account.id,
                        name: account.name,
                        type: account.type,
                        accountUserAccounts: account.accountUserAccounts.map(
                            ({
                                emailAddress,
                                familyName,
                                givenName,
                                roleBriefs,
                            }) => ({
                                emailAddress,
                                familyName,
                                givenName,
                                roleBriefs,
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

                    let address = item?.postalAddresses
                        ? [...item.postalAddresses]
                        : [];

                    if (!address.length) {
                        const addressResponse =
                            await koroneikiApi.getKoroneikiPostalAddress(
                                item.key,
                            );

                        address = addressResponse.items;
                    }

                    items.push({
                        address,
                        description: koroneikiAccount.description,
                        contactEmailAddress:
                            koroneikiAccount.contactEmailAddress,
                        externalReferenceCode: koroneikiAccount.key,
                        key: koroneikiAccount.key,
                        name: koroneikiAccount.name,
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

        if (cache.has(key)) {
            logger.info('[getUserAccountByEmailAddress] cache found account');

            return cache.get(key);
        }

        const { data } = await getUserAccountByEmailAddress({
            client: liferayClient,
            path: {
                emailAddress,
            },
        });

        logger.info(
            `[getUserAccountByEmailAddress] account fetch for ${emailAddress}`,
        );

        if (data) {
            cache.set(key, data);
        }

        return data;
    }

    async syncKoroneikiAccountMembers(
        liferayAccount: AccountWithUserAccount,
        koroneikiAccount: KoroneikiAccount,
    ) {
        const { items: koroneikiContacts } =
            await koroneikiApi.getKoroneikiAccountContacts(
                koroneikiAccount.key,
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
                    cache.set(`emailAddress:${emailAddress}`, data);
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
    }

    async syncLiferayAccount(
        liferayAccount: Account | undefined,
        koroneikiAccount: KoroneikiAccount,
    ) {
        if (!liferayAccount) {
            const { data, error } = await postAccount({
                body: {
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

            await this.syncKoroneikiAccountMembers(
                liferayAccount as AccountWithUserAccount,
                koroneikiAccount,
            );

            i++;
        }
    }
}

const koroneikAccountSync = new KoroneikAccountSync();

await koroneikAccountSync.getDXPAccounts();
await koroneikAccountSync.getKoroneikiAccounts();

koroneikAccountSync.main();
