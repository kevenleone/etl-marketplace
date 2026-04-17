import process from 'node:process';

import {
    PostalAddress,
    deleteAccountUserAccountByEmailAddress,
    getAccountByExternalReferenceCode,
    getAccountGroupAccountsPage,
    getAccountGroupByExternalReferenceCode,
    getAccountsPage,
    getUserAccountByEmailAddress,
    patchAccount,
    postAccount,
    postAccountGroupByExternalReferenceCodeAccountByExternalReferenceCode,
    postAccountPostalAddress,
    postAccountUserAccountByEmailAddress,
    postUserAccount,
} from 'liferay-headless-rest-client/headless-admin-user-v1.0';

import {
    Country,
    getCountriesPage,
} from 'liferay-headless-rest-client/headless-admin-address-v1.0';

import mongoose from 'mongoose';
import { KoroneikiAccountModel } from './model';
import { Account, KoroneikiAccount, KoroneikiContact } from './types';

import { koroneikiApi } from '../../services/koroneikiApi';

import { SearchBuilder } from 'odata-search-builder';
import PaginationRun from '../../core/PaginationRun';
import { liferayClient } from '../../services/liferay';
import { APIResponse } from '../../types';
import Cache from '../../utils/cache';
import { logger } from '../../utils/logger';
import { path, paths } from '../../utils/paths';
import { isEmailAddressValid } from '../../utils/validators';

await mongoose.connect(
    'mongodb://root:root@localhost:27017/etl-marketplace?authSource=admin',
);

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

const { data: accountGroup, error } =
    await getAccountGroupByExternalReferenceCode({
        client: liferayClient,
        path: { externalReferenceCode: 'PARTNERS' },
    });

console.log(error, accountGroup);

if (!accountGroup || (error as any)?.status === 'NOT_FOUND') {
    logger.error('Unable to proceed without AccountGroup');

    process.exit(1);
}

const { data: accountGroupAccountsPage } = await getAccountGroupAccountsPage({
    client: liferayClient,
    path: { accountGroupId: String(accountGroup!.id) },
    query: { pageSize: '-1' },
});

const accountGroupAccountsMap = new Map(
    accountGroupAccountsPage?.items?.map((accountGroupAccount) => [
        accountGroupAccount.externalReferenceCode,
        accountGroupAccount,
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
            // console.log(cacheInstance.cache.keys());

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
                        _isPartner: koroneikiAccount.entitlements.some(
                            ({ name }) =>
                                name.toLocaleLowerCase() === 'partner',
                        ),
                        description: koroneikiAccount.description,
                        externalLinks: koroneikiAccount.externalLinks,
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

        logger.info('[getKoroneikiAccounts] writing to MongoDB');

        for (const item of items) {
            await KoroneikiAccountModel.findOneAndUpdate(
                { key: item.key },
                item,
                { upsert: true, returnDocument: 'after' },
            );
        }

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

        const liferayAccountsToUnassociate =
            liferayAccount?.accountUserAccounts?.filter(
                ({ emailAddress }) =>
                    !koroneikiContacts.find(
                        ({ emailAddress: koroneikiEmailAddress }) =>
                            koroneikiEmailAddress === emailAddress,
                    ),
            ) ?? [];

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

    getSalesforceProjectKey(koroneikiAccount: KoroneikiAccount): string {
        for (const externalLink of koroneikiAccount.externalLinks || []) {
            const domain = externalLink.domain?.toLowerCase();
            const entityName = externalLink.entityName?.toLowerCase();

            if (domain === 'salesforce' && entityName === 'project') {
                return externalLink.entityId;
            }
        }

        return '';
    }

    getSalesforceAccountKey(koroneikiAccount: KoroneikiAccount): string {
        for (const externalLink of koroneikiAccount.externalLinks || []) {
            const domain = externalLink.domain?.toLowerCase();
            const entityName = externalLink.entityName?.toLowerCase();

            if (
                (domain === 'salesforce' || domain === 'dossiera') &&
                entityName === 'account'
            ) {
                return externalLink.entityId;
            }
        }

        return '';
    }

    async getSalesforceProject(salesforceProject: string) {
        const key = `salesforce:project:${salesforceProject}`;

        if (cacheInstance.has(key)) {
            return cacheInstance.get(key);
        }

        const { data } = await liferayClient.get({
            url: `/o/c/salesforceprojects?filter=${SearchBuilder.eq('externalReferenceCode', salesforceProject)}`,
        });

        const response = data as APIResponse;

        if (response?.totalCount > 0) {
            cacheInstance.set(key, response.items[0]);

            return response.items[0];
        }

        return null;
    }

    async getKoroneikiAccount(accountKey: string) {
        let koroneikiAccount = cacheInstance.get(
            `koroneiki-account:${accountKey}`,
        );

        if (koroneikiAccount) {
            return koroneikiAccount;
        }

        koroneikiAccount = await koroneikiApi.getKoroneikiAccount(accountKey);

        if (koroneikiAccount) {
            cacheInstance.set(
                `koroneiki-account:${accountKey}`,
                koroneikiAccount,
            );
        }

        return koroneikiAccount;
    }

    async syncSalesforceAccount(
        salesforceAccountKey: string,
        koroneikiAccount: KoroneikiAccount,
    ) {
        const salesforceProject =
            await this.getSalesforceProject(salesforceAccountKey);

        if (salesforceProject) {
            return logger.info(
                `[syncSalesforceAccount] Salesforce Project already exists ${salesforceAccountKey}`,
            );
        }

        let marketplaceAccount = await this.getMarketplaceAccount(
            koroneikiAccount.parentAccountKey,
        );

        if (!marketplaceAccount) {
            if (!koroneikiAccount.parentAccountKey) {
                return logger.info(
                    `[syncSalesforceAccount] No parent account key for ${koroneikiAccount.key}`,
                );
            }

            marketplaceAccount = (await this.createMarketplaceAccount(
                await this.getKoroneikiAccount(
                    koroneikiAccount.parentAccountKey,
                ),
            )) as Account;
        }

        const response = await liferayClient.post({
            body: {
                externalReferenceCode: salesforceAccountKey,
                koroneikiAccountKey: koroneikiAccount.key,
                name: koroneikiAccount.name,
                r_salesforceProjectToAccounts_accountEntryERC:
                    koroneikiAccount.parentAccountKey,
            },
            url: `/o/c/salesforceprojects`,
        });

        if (response.data) {
            cacheInstance.set(
                `salesforce:project:${salesforceAccountKey}`,
                response.data,
            );

            logger.info('[syncSalesforceAccount] project created');

            return response.data;
        }
    }

    async getMarketplaceAccount(externalReferenceCode: string) {
        const key = `marketplace-account:${externalReferenceCode}`;
        const cached = cacheInstance.get(key);

        if (cached) {
            return cached as Account;
        }

        const response = await getAccountByExternalReferenceCode({
            client: liferayClient,
            path: { externalReferenceCode },
        });

        if (response.data) {
            cacheInstance.set(key, response.data as Account);

            return response.data as Account;
        }

        return undefined;
    }

    async createMarketplaceAccount(koroneikiAccount: KoroneikiAccount) {
        const salesforceAccountKey =
            this.getSalesforceAccountKey(koroneikiAccount);

        const accountBody = {
            customFields: [
                {
                    name: 'koroneiki-parent-account-key',
                    customValue: {
                        data: koroneikiAccount.parentAccountKey,
                    } as any,
                },
                {
                    name: 'salesforce-account-key',
                    customValue: {
                        data: salesforceAccountKey,
                    } as any,
                },
            ],
            externalReferenceCode: koroneikiAccount.key,
            name: koroneikiAccount.name,
        };

        const { data, error } = await postAccount({
            body: accountBody,
            client: liferayClient,
            query: { nestedFields: 'accountUserAccounts' } as any,
        });

        cacheInstance.set(
            `marketplace-account:${koroneikiAccount.key}`,
            data as Account,
        );

        this.dynamicLog(
            `[createMarketplaceAccount] post account "${koroneikiAccount.name}"`,
            error,
        );

        return data;
    }

    async syncMarketplaceAccount(
        liferayAccount: Account | undefined,
        koroneikiAccount: KoroneikiAccount,
    ) {
        const salesforceProjectKey =
            this.getSalesforceProjectKey(koroneikiAccount);

        /**
         * If a Salesforce Project key exists, sync the Salesforce Project
         * Into Marketplace Object Definition and stop the process.
         */

        if (salesforceProjectKey) {
            logger.info('SalesforceProjectKey ' + salesforceProjectKey);

            await this.syncSalesforceAccount(
                salesforceProjectKey,
                koroneikiAccount,
            );

            return;
        }

        /**
         * If is not a Salesforce Project, sync into a Marketplace account.
         */

        if (!liferayAccount) {
            return this.createMarketplaceAccount(koroneikiAccount);
        }

        const salesforceAccountKey =
            this.getSalesforceAccountKey(koroneikiAccount);

        const accountBody = {
            customFields: [
                {
                    name: 'koroneiki-parent-account-key',
                    customValue: {
                        data: koroneikiAccount.parentAccountKey,
                    } as any,
                },
                {
                    name: 'salesforce-account-key',
                    customValue: {
                        data: salesforceAccountKey,
                    } as any,
                },
            ],
            externalReferenceCode: koroneikiAccount.key,
            name: koroneikiAccount.name,
        };

        const { error } = await patchAccount({
            body: accountBody,
            client: liferayClient,
            path: { accountId: `${liferayAccount.id}` },
        });

        this.dynamicLog(`[syncMarketplaceAccount] patch account`, error);

        return liferayAccount;
    }

    async syncAccountAddress(
        liferayAccount: AccountWithUserAccount,
        koroneikiAccount: KoroneikiAccount,
    ) {
        if (!koroneikiAccount.postalAddresses.length) {
            return logger.warn('No Koroneiki Account addresses to Sync');
        }

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

            let addressRegion = koroneikiPostalAddress.addressRegion;

            if (!addressRegion) {
                addressRegion =
                    countriesRegionMap.get(
                        koroneikiPostalAddress.addressCountry
                            ?.toLowerCase()
                            ?.replace(' ', '-'),
                    )?.[0] || '';

                logger.info(
                    '[syncAccountAddress] using fallback region ' +
                        addressRegion,
                );
            }

            const { error, request, response } = await postAccountPostalAddress(
                {
                    body: {
                        addressCountry: koroneikiPostalAddress.addressCountry,
                        addressLocality: koroneikiPostalAddress.addressLocality,
                        name: koroneikiPostalAddress.primary
                            ? 'Primary Address'
                            : 'Secondary Address',
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
                },
            );

            if (error) {
                console.error('liferayAccount', liferayAccount);
                console.error('request', request);
                console.error('response', response);
            }

            this.dynamicLog(
                `[syncAccountAddress] post account address: ${JSON.stringify(koroneikiPostalAddress)}`,
                error,
            );
        }
    }

    async syncAccountGroups(
        liferayAccount: AccountWithUserAccount,
        koroneikiAccount: KoroneikiAccount,
    ) {
        if (!koroneikiAccount._isPartner) {
            logger.warn('Not a partner');

            return;
        }

        if (accountGroupAccountsMap.has(liferayAccount.externalReferenceCode)) {
            logger.warn('Skipping, already belong to accountGroup');

            return;
        }

        const { error } =
            await postAccountGroupByExternalReferenceCodeAccountByExternalReferenceCode(
                {
                    client: liferayClient,
                    path: {
                        externalReferenceCode: 'PARTNERS',
                        accountExternalReferenceCode:
                            liferayAccount.externalReferenceCode,
                    },
                },
            );

        this.dynamicLog(
            '[syncAccountGroups] Added in Partners Account Group',
            error,
        );

        accountGroupAccountsMap.set(
            liferayAccount.externalReferenceCode,
            liferayAccount as any,
        );
    }

    async main() {
        logger.warn(`[main] start processing`);

        const marketplaceAccounts = await this.getFileEntryValues<Account[]>(
            path.join(paths.json, 'dxp-accounts.json'),
            [],
        );

        const koroneikiAccounts = (await KoroneikiAccountModel.find({
            processed: { $eq: false },
            // postalAddresses: { $ne: [], $exists: true },
        }).lean()) as KoroneikiAccount[];

        for (const marketplaceAccount of marketplaceAccounts) {
            cacheInstance.set(
                `marketplace-account:${marketplaceAccount.externalReferenceCode}`,
                marketplaceAccount,
            );
        }

        for (const koroneikiAccount of koroneikiAccounts) {
            cacheInstance.set(
                `koroneiki-account:${koroneikiAccount.key}`,
                koroneikiAccount,
            );
        }

        let i = 1;

        for (const koroneikiAccount of koroneikiAccounts) {
            let liferayAccount = cacheInstance.get(
                `marketplace-account:${koroneikiAccount.externalReferenceCode}`,
            );

            logger.info('\n');
            logger.info(
                `[main:start] ============================= "${koroneikiAccount.name}" =============================`,
            );
            logger.info(
                `[main:start] - Koroneiki Account ${i}/${koroneikiAccounts.length}`,
            );

            liferayAccount = await this.syncMarketplaceAccount(
                liferayAccount,
                koroneikiAccount,
            );

            if (!liferayAccount) {
                logger.info('[main] Liferay account not exist');

                await KoroneikiAccountModel.updateOne(
                    { key: koroneikiAccount.key },
                    { processed: true },
                );

                i++;

                continue;
            }

            for (const sync of [
                this.syncAccountGroups,
                this.syncAccountAddress,
                this.syncKoroneikiAccountMembers,
            ]) {
                await sync.call(
                    this,
                    liferayAccount as AccountWithUserAccount,
                    koroneikiAccount,
                );
            }

            await KoroneikiAccountModel.updateOne(
                { key: koroneikiAccount.key },
                { processed: true },
            );

            i++;
        }

        logger.info('Process finished.');

        process.exit(0);
    }
}

const koroneikAccountSync = new KoroneikAccountSync();

await koroneikAccountSync.getDXPAccounts();
// await koroneikAccountSync.getKoroneikiAccounts();
await koroneikAccountSync.main();
