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

type AccountWithUserAccount = Account & { accountUserAccounts: any[] };

class KoroneikAccountSync {
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
                            nestedFields: 'postalAddresses,accountUserAccounts',
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

    async getFileEntryValues<T>(filePath: string, defaultValue: T) {
        try {
            return Bun.file(filePath).json() as T;
        } catch {
            return defaultValue;
        }
    }

    async syncKoroneikiAccountMembers(
        liferayAccount: AccountWithUserAccount,
        koroneikiAccount: KoroneikiAccount,
    ) {
        logger.info(
            `[syncKoroneikiAccountMembers] processing ${koroneikiAccount.name}`,
        );

        const { items: koroneikiContacts } =
            await koroneikiApi.getKoroneikiAccountContacts(
                koroneikiAccount.key,
            );

        for (const koroneikiContact of koroneikiContacts) {
            const emailAddress = koroneikiContact.emailAddress;

            if (!isEmailAddressValid(emailAddress)) {
                continue;
            }

            const liferayUserAccount =
                liferayAccount?.accountUserAccounts?.find(
                    (userAccount) => userAccount.emailAddress === emailAddress,
                );

            if (liferayUserAccount) {
                logger.info(
                    `[syncKoroneikiAccountMembers] user ${emailAddress} already linked to "${liferayAccount.name}"`,
                );

                continue;
            }

            let { data: userAccount } = await getUserAccountByEmailAddress({
                client: liferayClient,
                path: {
                    emailAddress: decodeURIComponent(
                        koroneikiContact.emailAddress,
                    ),
                },
            });

            if (!userAccount) {
                const { data, error } = await postUserAccount({
                    body: {
                        alternateName: koroneikiContact.firstName,
                        emailAddress,
                        familyName: koroneikiContact.lastName,
                        givenName: koroneikiContact.firstName,
                    },
                    client: liferayClient,
                });

                userAccount = data;

                this.dynamicLog(
                    `[syncKoroneikiAccountMembers] post user account "${emailAddress}"`,
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
                `[syncKoroneikiAccountMembers] linked used "${emailAddress}" to account "${koroneikiAccount.name}"`,
                error,
            );
        }
    }

    dynamicLog(description: string, error: unknown) {
        if (error) {
            return logger.error(
                `${description}, error: ${JSON.stringify(error)}`,
            );
        }

        logger.info(description);
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
            dxpAccounts.map((account: any) => [
                account.externalReferenceCode,
                account,
            ]),
        );

        for (const koroneikiAccount of koroneikiAccounts) {
            let liferayAccount = dxpAccountsMap.get(
                koroneikiAccount.externalReferenceCode,
            );

            logger.info(
                `[main:start] ============================= "${koroneikiAccount.name}" =============================`,
            );

            if (liferayAccount) {
                const { error } = await patchAccount({
                    body: {
                        externalReferenceCode: koroneikiAccount.key,
                        description: koroneikiAccount.description,
                        name: koroneikiAccount.name,
                    },
                    client: liferayClient,
                    path: { accountId: `${liferayAccount.id}` },
                });

                this.dynamicLog(
                    `[main] patch account "${liferayAccount.name}"`,
                    error,
                );
            } else {
                const { data, error } = await postAccount({
                    body: {
                        externalReferenceCode: koroneikiAccount.key,
                        name: koroneikiAccount.name,
                    },
                    client: liferayClient,
                    query: { nestedFields: 'accountUserAccounts' } as any,
                });

                liferayAccount = data as Account;

                this.dynamicLog(
                    `[main] post account "${koroneikiAccount.name}"`,
                    error,
                );
            }

            if (!liferayAccount) {
                logger.info('[main] Liferay account not exist');

                continue;
            }

            await this.syncKoroneikiAccountMembers(
                liferayAccount as AccountWithUserAccount,
                koroneikiAccount,
            );

            logger.info('\n');
        }
    }
}

const koroneikAccountSync = new KoroneikAccountSync();

await koroneikAccountSync.getDXPAccounts();
// await koroneikAccountSync.getKoroneikiAccounts();

koroneikAccountSync.main();
