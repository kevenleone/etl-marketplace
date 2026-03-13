import process from 'node:process';

import {
    getAccountGroupByExternalReferenceCodeAccountsPage,
    postAccountGroupByExternalReferenceCodeAccountByExternalReferenceCode,
    deleteAccountGroupByExternalReferenceCodeAccountByExternalReferenceCode,
} from 'liferay-headless-rest-client/headless-admin-user-v1.0';

import PaginationRun from '../../core/PaginationRun';
import { koroneikiApi } from '../../services/koroneikiApi';
import { liferayClient } from '../../services/liferay';
import { logger } from '../../utils/logger';

const ACCOUNT_GROUP_ERC = 'liferay-partners';

class KoroneikiPartnerAccountGroupSync {
    constructor() {
        this.gracefullyShutdown();
    }

    gracefullyShutdown() {
        function handleShutdown(signal: string) {
            logger.warn(
                `[SHUTDOWN] Received ${signal} signal - exiting gracefully`,
            );

            process.exit(0);
        }

        process.on('SIGINT', () => handleShutdown('SIGINT'));
        process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    }

    async getKoroneikiPartnerAccounts() {
        logger.info('[getKoroneikiPartnerAccounts] start processing');

        const paginationRun = new PaginationRun();
        const items: any[] = [];

        await paginationRun.dryRun(
            {
                name: 'getKoroneikiPartnerAccounts',
                fetchData: (page, pageSize) =>
                    koroneikiApi.getKoroneikiAccounts(
                        new URLSearchParams({
                            filter: "entitlements/any(s:contains(s,'Subscription') or s eq 'Partner')",
                            page: `${page}`,
                            pageSize: `${pageSize}`,
                        }),
                    ),
                processItem: async (item: any) => {
                    items.push(item);
                },
            },
            { page: 1, pageSize: 50 },
        );

        logger.info(
            `[getKoroneikiPartnerAccounts] found ${items.length} accounts`,
        );

        return items;
    }

    async getAccountsAlreadyInGroup(): Promise<Set<string>> {
        logger.info('[getAccountsAlreadyInGroup] start processing');

        const response =
            await getAccountGroupByExternalReferenceCodeAccountsPage({
                client: liferayClient,
                path: {
                    accountGroupExternalReferenceCode: ACCOUNT_GROUP_ERC,
                },
                query: {
                    page: '1',
                    pageSize: '200',
                },
            });

        const set = new Set(
            response?.items?.map((account) => account.externalReferenceCode) ||
                [],
        );

        logger.info(
            `[getAccountsAlreadyInGroup] group has ${set.size} accounts`,
        );

        return set;
    }

    async associateAccountToGroup(accountERC: string, index: number) {
        const { error } =
            await postAccountGroupByExternalReferenceCodeAccountByExternalReferenceCode(
                {
                    client: liferayClient,
                    path: {
                        externalReferenceCode: ACCOUNT_GROUP_ERC,
                        accountExternalReferenceCode: accountERC,
                    },
                },
            );

        if (error) {
            logger.error(
                `[associateAccountToGroup] [${index}] failed for ${accountERC} - ${JSON.stringify(
                    error,
                )}`,
            );
        } else {
            logger.info(
                `[associateAccountToGroup] [${index}] associated ${accountERC}`,
            );
        }
    }

    async removeAccountFromGroup(accountERC: string, index: number) {
        const { error } =
            await deleteAccountGroupByExternalReferenceCodeAccountByExternalReferenceCode(
                {
                    client: liferayClient,
                    path: {
                        externalReferenceCode: ACCOUNT_GROUP_ERC,
                        accountExternalReferenceCode: accountERC,
                    },
                },
            );

        if (error) {
            logger.error(
                `[removeAccountFromGroup] [${index}] failed to remove ${accountERC} - ${JSON.stringify(
                    error,
                )}`,
            );
        } else {
            logger.info(
                `[removeAccountFromGroup] [${index}] removed ${accountERC} from group`,
            );
        }
    }

    async syncAccounts(
        koroneikiPartners: any[],
        existingAccounts: Set<string>,
    ) {
        logger.info('[syncAccounts] start processing');

        const partnerSet = new Set(koroneikiPartners.map((acc) => acc.key));

        let i = 1;
        for (const account of koroneikiPartners) {
            const accountERC = account.key;

            logger.info(
                `[syncAccounts] adding ${i}/${koroneikiPartners.length} - ${accountERC}`,
            );

            if (existingAccounts.has(accountERC)) {
                logger.info(
                    `[syncAccounts] skipping ${accountERC} (already in group)`,
                );
                i++;
                continue;
            }

            await this.associateAccountToGroup(accountERC, i);

            i++;
        }

        i = 1;
        for (const accountERC of existingAccounts) {
            if (partnerSet.has(accountERC)) {
                logger.info(
                    `[syncAccounts] removing ${i}/${existingAccounts.size} - ${accountERC}`,
                );
                await this.removeAccountFromGroup(accountERC, i);
                i++;
            }
        }

        logger.info('[syncAccounts] finished processing');
    }

    async main() {
        logger.warn('[main] start Partner Account Group Sync');

        const existingAccounts = await this.getAccountsAlreadyInGroup();
        const koroneikiPartners = await this.getKoroneikiPartnerAccounts();

        await this.syncAccounts(koroneikiPartners, existingAccounts);

        logger.warn('[main] Partner Account Group Sync finished');
    }
}

const sync = new KoroneikiPartnerAccountGroupSync();

await sync.main();
