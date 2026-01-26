import '../../core/SafeRunner';

import { koroneikiApi } from '../../services/koroneikiApi';
import api from '../../services/api';
import { Account, DxpUserAccount, KoroneikiAccount } from './types';
import pino from 'pino';
import { join } from 'path';

const logger = pino({
    level: 'info',
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
        },
    },
});

const accountFilter =
    "entitlements/any(s:contains(s, 'Subscription') or s eq 'Partner')";



class AccountSync {
    private koroneikiAccountsFile: string;
    private scriptDir: string;
    private dxpAccountsFile: string;

    constructor() {
        this.scriptDir = __dirname;
        this.dxpAccountsFile = join(this.scriptDir, 'dxp-accounts.json');
        this.koroneikiAccountsFile = join(
            this.scriptDir,
            'koroneiki-accounts.json',
        );
    }

    async exportDxpAccounts(): Promise<Account[]> {
        logger.info('Exportando accounts do DXP...');

        const allAccounts: Account[] = [];
        let page = 1;
        const pageSize = 100;
        let hasMore = true;

        while (hasMore) {
            try {
                const searchParams = new URLSearchParams();
                searchParams.set('page', page.toString());
                searchParams.set('pageSize', pageSize.toString());
                searchParams.set(
                    'nestedFields',
                    'customFields,postalAddresses,userAccount',
                );

                const response = await api.getAccounts(searchParams);
                const data = (await response.json()) as any;

                if (data.items && data.items.length > 0) {
                    allAccounts.push(...data.items);
                    logger.info(
                        `Página ${page}: ${data.items.length} accounts exportadas`,
                    );

                    page++;
                } else {
                    hasMore = false;
                }

            } catch (error: any) {
                logger.error(
                    `Erro ao exportar accounts do DXP (página ${page}):`,
                    error,
                );

                hasMore = false;
            }
        }

        await Bun.write(
            this.dxpAccountsFile,
            JSON.stringify(allAccounts, null, 2),
        );

        logger.info(
            `Total de ${allAccounts.length} accounts do DXP exportadas para ${this.dxpAccountsFile}`,
        );

        return allAccounts;
    }

    async exportKoroneikiAccounts(): Promise<KoroneikiAccount[]> {
        logger.info('Exportando accounts do Koroneiki...');

        try {
            const response =
                await koroneikiApi.getKoroneikiAccounts(accountFilter);

            const items = await Promise.all(
                (response.items as any[]).map(async (item: any) => {
                    let address = item?.postalAddresses
                        ? [...item.postalAddresses]
                        : [];

                    if (!address.length) {
                        try {
                            const addressResponse =
                                await koroneikiApi.getKoroneikiPostalAddress(
                                    item.key,
                                );

                            address = addressResponse.items;
                        } catch (error: any) {
                            logger.warn(
                                `Erro ao buscar endereço para account ${item.key}:`,
                                error,
                            );
                        }
                    }

                    return {
                        address,
                        contactEmailAddress: item.contactEmailAddress,
                        externalReferenceCode: item.key,
                        name: item.name,
                        type: 'business',
                    };
                }),
            );

            await Bun.write(
                this.koroneikiAccountsFile,
                JSON.stringify(items, null, 2),
            );

            logger.info(
                `Total de ${items.length} accounts do Koroneiki exportadas para ${this.koroneikiAccountsFile}`,
            );

            return items;

        } catch (error: any) {
            logger.error('Erro ao exportar accounts do Koroneiki:', error);
            throw error;
        }
    }

    async loadDxpAccounts(): Promise<Account[]> {
        try {
            const content = await Bun.file(this.dxpAccountsFile).text();

            return JSON.parse(content);

        } catch (error: any) {
            logger.error('Erro ao carregar arquivo de accounts DXP:', error);

            return [];
        }
    }

    async loadKoroneikiAccounts(): Promise<KoroneikiAccount[]> {
        try {
            const content = await Bun.file(this.koroneikiAccountsFile).text();

            return JSON.parse(content);

        } catch (error: any) {
            logger.error(
                'Erro ao carregar arquivo de accounts Koroneiki:',
                error,
            );
            
            return [];
        }
    }

    async findDxpUserAccountByEmail(
        email: string,
    ): Promise<DxpUserAccount | null> {
        try {
            const searchParams = new URLSearchParams();
            searchParams.set('filter', `emailAddress eq '${email}'`);
            searchParams.set('pageSize', '1');

            const response = await api.getUserAccounts(searchParams);
            const data = (await response.json()) as any;

            if (data.items && data.items.length > 0) {
                return data.items[0];
            }

            return null;
        } catch (error: any) {
            logger.error(
                `Erro ao buscar UserAccount por email ${email}:`,
                error,
            );
            return null;
        }
    }

    parseNameForUserAccount(fullName: string): {
        givenName: string;
        familyName: string;
    } {
        const nameParts = fullName.trim().split(' ');

        if (nameParts.length === 1) {
            return {
                givenName: nameParts[0],
                familyName: 'Default',
            };
        }

        return {
            givenName: nameParts[0],
            familyName: nameParts.slice(1).join(' '),
        };
    }

    async createAndLinkUserAccount(
        koroneikiAccount: KoroneikiAccount,
        dxpAccountId: number,
    ): Promise<DxpUserAccount | null> {
        try {
            const existingUser = await this.findDxpUserAccountByEmail(
                koroneikiAccount.contactEmailAddress,
            );

            if (existingUser) {
                logger.info(
                    `UserAccount já existe: ${koroneikiAccount.contactEmailAddress} - Verificando vinculação`,
                );

                const isLinkedToCorrectAccount =
                    existingUser.accountBriefs?.some(
                        (accountBrief: any) => accountBrief.id === dxpAccountId,
                    );

                if (!isLinkedToCorrectAccount) {
                    logger.info(
                        `Vinculando UserAccount existente à Account ${dxpAccountId}`,
                    );
                    await api.addUserToAccount(dxpAccountId, {
                        emailAddress: koroneikiAccount.contactEmailAddress,
                        givenName: this.parseNameForUserAccount(
                            koroneikiAccount.name,
                        ).givenName,
                        familyName: this.parseNameForUserAccount(
                            koroneikiAccount.name,
                        ).familyName,
                        alternateName: koroneikiAccount.name,
                        externalReferenceCode:
                            koroneikiAccount.externalReferenceCode,
                    });
                }

                return existingUser;
            }

            logger.info(
                `Criando novo UserAccount: ${koroneikiAccount.contactEmailAddress}`,
            );

            const { givenName, familyName } = this.parseNameForUserAccount(
                koroneikiAccount.name,
            );

            const userAccountData = {
                emailAddress: koroneikiAccount.contactEmailAddress,
                givenName,
                familyName,
                alternateName: koroneikiAccount.name,
                externalReferenceCode: koroneikiAccount.externalReferenceCode,
            };

            const response = await api.createUserAccount(userAccountData);
            const newUser = (await response.json()) as DxpUserAccount;

            logger.info(
                `Vinculando novo UserAccount ${newUser.emailAddress} à Account ${dxpAccountId}`,
            );
            await api.addUserToAccount(dxpAccountId, {
                emailAddress: koroneikiAccount.contactEmailAddress,
                givenName,
                familyName,
                alternateName: koroneikiAccount.name,
                externalReferenceCode: koroneikiAccount.externalReferenceCode,
            });

            return newUser;
        } catch (error: any) {
            logger.error(
                `Erro ao criar/vincular UserAccount ${koroneikiAccount.contactEmailAddress}:`,
                error,
            );
            return null;
        }
    }

    findDxpAccountByKoroneiki(
        dxpAccounts: Account[],
        koroneikiAccount: KoroneikiAccount,
    ): Account | null {
        return (
            dxpAccounts.find((dxpAccount) => {
                if (
                    dxpAccount.externalReferenceCode ===
                    koroneikiAccount.externalReferenceCode
                ) {
                    return true;
                }

                if (dxpAccount.name === koroneikiAccount.name) {
                    return true;
                }

                if (dxpAccount.accountContactInformation?.emailAddresses) {
                    const dxpEmails =
                        dxpAccount.accountContactInformation.emailAddresses.map(
                            (email: any) => email.address,
                        );
                    if (
                        dxpEmails.includes(koroneikiAccount.contactEmailAddress)
                    ) {
                        return true;
                    }
                }

                return false;
            }) || null
        );
    }

    async syncAccounts(dryRun: boolean = false): Promise<void> {
        logger.info(`Iniciando sincronização de accounts (dry-run: ${dryRun})`);

        const dxpAccounts = await this.loadDxpAccounts();
        const koroneikiAccounts = await this.loadKoroneikiAccounts();

        if (dxpAccounts.length === 0 || koroneikiAccounts.length === 0) {
            logger.error(
                'Nenhuma account encontrada para sincronização. Execute as exportações primeiro.',
            );
            return;
        }

        const stats = {
            created: 0,
            updated: 0,
            userAccountsCreated: 0,
            userAccountsLinked: 0,
            errors: 0,
        };

        for (const koroneikiAccount of koroneikiAccounts) {
            try {
                const existingDxpAccount = this.findDxpAccountByKoroneiki(
                    dxpAccounts,
                    koroneikiAccount,
                );

                let targetAccountId: number;

                if (existingDxpAccount) {
                    logger.info(
                        `Account encontrada no DXP: ${koroneikiAccount.name} (ID: ${existingDxpAccount.id}) - Atualizando`,
                    );

                    if (!dryRun) {
                        await api.updateAccount(existingDxpAccount.id, {
                            externalReferenceCode:
                                koroneikiAccount.externalReferenceCode,
                            name: koroneikiAccount.name,
                            type: koroneikiAccount.type,
                        });
                    }

                    targetAccountId = existingDxpAccount.id;
                    stats.updated++;
                } else {
                    logger.info(
                        `Criando nova account no DXP: ${koroneikiAccount.name}`,
                    );

                    let newAccountId: number;
                    if (!dryRun) {
                        const accountResponse = await api.createAccount({
                            externalReferenceCode:
                                koroneikiAccount.externalReferenceCode,
                            name: koroneikiAccount.name,
                            type: koroneikiAccount.type,
                        });
                        const newAccount =
                            (await accountResponse.json()) as any;
                        newAccountId = newAccount.id;
                    } else {
                        newAccountId = 0; 
                    }

                    targetAccountId = newAccountId;
                    stats.created++;
                }

                if (targetAccountId && targetAccountId > 0) {
                    logger.info(
                        `Processando UserAccount para ${koroneikiAccount.contactEmailAddress} vinculada à Account ${targetAccountId}`,
                    );

                    if (!dryRun) {
                        const userAccountResult =
                            await this.createAndLinkUserAccount(
                                koroneikiAccount,
                                targetAccountId,
                            );

                        if (userAccountResult) {
                            const existingUser =
                                await this.findDxpUserAccountByEmail(
                                    koroneikiAccount.contactEmailAddress,
                                );

                            if (existingUser) {
                                stats.userAccountsLinked++;
                            } else {
                                stats.userAccountsCreated++;
                            }
                        } else {
                            logger.error(
                                `Falha ao criar/vincular UserAccount ${koroneikiAccount.contactEmailAddress}`,
                            );
                            stats.errors++;
                        }
                    } else {
                     
                        const existingUser =
                            await this.findDxpUserAccountByEmail(
                                koroneikiAccount.contactEmailAddress,
                            );

                        if (existingUser) {
                            stats.userAccountsLinked++;
                        } else {
                            stats.userAccountsCreated++;
                        }
                    }
                }
            } catch (error: any) {
                logger.error(
                    `Erro ao sincronizar account ${koroneikiAccount.name}:`,
                    error,
                );
                stats.errors++;
            }
        }

        logger.info('Sincronização concluída:');
        logger.info(`- Accounts criadas: ${stats.created}`);
        logger.info(`- Accounts atualizadas: ${stats.updated}`);
        logger.info(`- UserAccounts criadas: ${stats.userAccountsCreated}`);
        logger.info(`- UserAccounts vinculadas: ${stats.userAccountsLinked}`);
        logger.info(`- Erros: ${stats.errors}`);
    }

    async run(
        options: { exportOnly?: boolean; dryRun?: boolean } = {},
    ): Promise<void> {
        try {
            logger.info('Iniciando Account Sync...');

            await this.exportDxpAccounts();
            await this.exportKoroneikiAccounts();

            if (!options.exportOnly) {
                await this.syncAccounts(options.dryRun);
            }

            logger.info('Account Sync concluído com sucesso!');
        } catch (error: any) {
            logger.error('Erro durante Account Sync:', error);
            throw error;
        }
    }
}

const accountSync = new AccountSync();

if (import.meta.main) {
    const args = process.argv.slice(2);
    const options = {
        exportOnly: args.includes('--export-only'),
        dryRun: args.includes('--dry-run'),
    };

    await accountSync.run(options);
}

export { AccountSync };
