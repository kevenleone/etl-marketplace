import { koroneikiApi } from '../../services/koroneikiApi';
import api from '../../services/api';
import { Account, DxpUserAccount, KoroneikiAccount } from './types';
import { logger } from '../../utils/logger';
import { liferayClient } from '../../services/liferay';
import { getAccountsPage, UserAccount } from 'liferay-headless-rest-client/headless-admin-user-v1.0';
import { APIResponse } from '../../types';

const accountFilter = "entitlements/any(s:contains(s, 'Subscription') or s eq 'Partner')";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class KoroneikAccountSync {
    dxpAccountsFile = `${__dirname}/dxp-accounts.json`
    koroneikiAccountsFile = `${__dirname}/koroneiki-accounts.json`;

    constructor() {
    }

    async createAccount({
        externalReferenceCode,
        name,
        type,
    }: {
        externalReferenceCode: string;
        name: string;
        type: string;
    }) {
        const response = await api.createAccount({
            externalReferenceCode,
            name,
            type,
        });

        return await response.json();
    }

    async fetchAccountsDXP() {
        const response = await api.getAccounts();
    }

    async getDXPAccounts(page: number, pageSize: number) {
        const response = await getAccountsPage({
            client: liferayClient,
            query: {
                nestedFields: 'customFields,postalAddresses,userAccount',
                page: page.toString(),
                pageSize: pageSize.toString(),
            },
        });

        await Bun.write(
            './packages/etl/src/scripts/Accounts-koroneiki/dxp-accounts.json',
            JSON.stringify(response.data, null, 2),
        );

    }

    async getkoroneikAccounts(filters?: string) {
        const response = await koroneikiApi.getKoroneikiAccounts(filters);
        let items = []

        for (const item of response.items) {
            let address = item?.postalAddresses
                ? [...item.postalAddresses]
                : [];

            if (!address.length) {
                const addressResponse =
                    await koroneikiApi.getKoroneikiPostalAddress(item.key);

                address = addressResponse.items;
            }

            items.push({
                address,
                contactEmailAddress: item.contactEmailAddress,
                externalReferenceCode: item.key,
                name: item.name,
                type: 'business',
            });
        }

        await Bun.write(
            './packages/etl/src/scripts/Accounts-koroneiki/koroneiki-accounts.json',
            JSON.stringify(items, null, 2),
        );

        return items;
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

    async addUserToAccount(koroneikiAccount: KoroneikiAccount, dxpAccountId: number) {
        const { givenName, familyName } = this.parseNameForUserAccount(
            koroneikiAccount.name,
        );

        return await api.addUserToAccount(dxpAccountId, {
            emailAddress: koroneikiAccount.contactEmailAddress,
            givenName,
            familyName,
            alternateName: koroneikiAccount.name,
            externalReferenceCode: koroneikiAccount.externalReferenceCode,
        });
    }

    async verifyIsAValidEmail(email: string): Promise<boolean> {
        const emailRegex =
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    }

    async createUserAccount(
        koroneikiAccount: KoroneikiAccount,
    ): Promise<DxpUserAccount | null> {

        const { givenName, familyName } = this.parseNameForUserAccount(
            koroneikiAccount.name,
        );

        const userAccountData = {
            emailAddress: await this.normalizeEmail(koroneikiAccount.contactEmailAddress),
            givenName: await this.removeSpecialCharactersFromString(givenName),
            familyName: await this.removeSpecialCharactersFromString(familyName),
            alternateName: await this.removeSpecialCharactersFromString(koroneikiAccount.name),
            externalReferenceCode: koroneikiAccount.externalReferenceCode,
        };

        console.log("🚀 ~ KoroneikAccountSync ~ createAndLinkUserAccount ~ userAccountData:", userAccountData)

        const response = await api.createUserAccount(userAccountData);
        const newUser = (await response.json()) as DxpUserAccount;

        logger.info(
            `Vinculando novo UserAccount ${newUser.emailAddress} à Account ${newUser}`,
        );





        return newUser
    }

    async linkUserAccountToAccunt(koroneikiAccount: KoroneikiAccount, dxpAccountId: number) {
        return await this.addUserToAccount(koroneikiAccount, dxpAccountId)
    }

    async findDxpUserAccountByEmail(
        email: string,
    ): Promise<DxpUserAccount | null> {
        try {
            const searchParams = new URLSearchParams();
            searchParams.set('filter', `emailAddress eq '${email}'`);

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

    async loadFile<T>(file: string, type: string): Promise<T | undefined> {
        try {
            const content = await Bun.file(file).text();

            return JSON.parse(content);

        } catch (error: any) {
            logger.error(`Erro ao carregar arquivo de accounts ${type}:`, error);

            return undefined;
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

    async removeSpecialCharactersFromString(valor: string): Promise<string> {
        return valor.replace(/[^a-zA-Z0-9]/g, '');
    }

    async updateUserAccount(
        koroneikiAccount: KoroneikiAccount,
        dxpAccountId: number,
    ): Promise<UserAccount | null> {
        try {
            const userAccountData = {
                emailAddress: koroneikiAccount.contactEmailAddress,
                givenName: await this.removeSpecialCharactersFromString(koroneikiAccount.name),
                familyName: await this.removeSpecialCharactersFromString(koroneikiAccount.name),
                alternateName: await this.removeSpecialCharactersFromString(koroneikiAccount.name),
                externalReferenceCode: koroneikiAccount.externalReferenceCode,
            };

            const response = await api.updateUserAccount(dxpAccountId, userAccountData);
            const data = (await response.json()) as UserAccount;

            return data;
        } catch (error: any) {
            logger.error(
                `Erro ao atualizar UserAccount ${koroneikiAccount.contactEmailAddress}:`,
                error,
            );
            return null;
        }
    }
    async updateDXPAccount(
        koroneikiAccount: KoroneikiAccount,
        dxpAccountId: number,
    ): Promise<Account | null> {
        try {
            const accountData = {
                name: koroneikiAccount.name,
                externalReferenceCode: koroneikiAccount.externalReferenceCode,
            };

            const response = await api.updateAccount(dxpAccountId, accountData);
            const data = (await response.json()) as Account;

            return data;
        } catch (error: any) {
            logger.error(
                `Erro ao atualizar Account ${koroneikiAccount.externalReferenceCode}:`,
                error,
            );
            return null;
        }
    }
    async linkUserToAccount(
        koroneikiAccount: KoroneikiAccount,
        dxpAccountId: number,
    ): Promise<UserAccount | null> {
        try {
            const userAccountData = {
                emailAddress: koroneikiAccount.contactEmailAddress,
                givenName: koroneikiAccount.name,
                familyName: koroneikiAccount.name,
                alternateName: koroneikiAccount.name,
                externalReferenceCode: koroneikiAccount.externalReferenceCode,
            };

            const response = await api.addUserToAccount(dxpAccountId, userAccountData);
            const data = (await response.json()) as UserAccount;

            return data;
        } catch (error: any) {
            logger.error(
                `Erro ao vincular UserAccount ${koroneikiAccount.contactEmailAddress}:`,
                error,
            );
            return null;
        }
    }

    async createDxpAccount(
        koroneikiAccount: KoroneikiAccount,
    ): Promise<Account | null> {
        try {
            const accountData = {
                name: koroneikiAccount.name,
                externalReferenceCode: koroneikiAccount.externalReferenceCode,
            };

            const response = await api.createAccount(accountData);
            const data = (await response.json()) as Account;

            return data;
        } catch (error: any) {
            logger.error(
                `Erro ao criar Account ${koroneikiAccount.externalReferenceCode}:`,
                error,
            );
            return null;
        }
    }

    async getUserAccounts(): Promise<UserAccount[]> {
        try {
            const response = await api.getUserAccounts();
            const data = (await response.json()) as UserAccount[];

            return data;
        } catch (error: any) {
            logger.error('Erro ao carregar UserAccounts:', error);
            return [];
        }
    }

    async normalizeEmail(
        value?: string | null,
        defaultDomain = 'liferay.com'
    ) {
        // Caso não venha nada
        if (!value || !value.trim()) {
            return `no-reply@${defaultDomain}`;
        }

        const trimmedValue = value.trim().toLowerCase();

        // Se já for um email válido, retorna
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue)) {
            return trimmedValue;
        }

        // Caso seja nome ou string qualquer
        const username = trimmedValue
            .normalize('NFD')                 // remove acentos
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '.')       // troca espaços e símbolos por "."
            .replace(/\.+/g, '.')             // evita múltiplos pontos
            .replace(/^\.|\.$/g, '');         // remove ponto no início/fim

        return `${username || 'user'}@${defaultDomain}`;
    }


    async main() {
        let dxpAccounts = await this.loadFile<APIResponse<Account>>(this.dxpAccountsFile, 'dxp')
        let koroneikiAccounts = await this.loadFile<KoroneikiAccount[]>(this.koroneikiAccountsFile, 'Koroneiki');

        const dxpAccountsMap = new Map(dxpAccounts?.items?.map((account: any) => [account.externalReferenceCode, account]));


        for (const koroneikiAccount of koroneikiAccounts as KoroneikiAccount[]) {

            const userAccount = await this.findDxpUserAccountByEmail(await this.normalizeEmail(koroneikiAccount.contactEmailAddress));
            const userAccountExists = userAccount !== null;

            let userAccountUpdated: UserAccount | null = null;
            let dxpAccountUpdated: Account | null = null;

            if (userAccountExists) {
                userAccountUpdated = await this.updateUserAccount(koroneikiAccount, userAccount.id);
            } else {
                userAccountUpdated = await this.createUserAccount(koroneikiAccount);
            }


            const dxpAccount = dxpAccountsMap.get(koroneikiAccount.externalReferenceCode);

            console.log("🚀 ~ KoroneikAccountSync ~ main ~ DXPACCOUNT:", dxpAccount)
            if (!dxpAccount) {
                logger.error(`NÃO EXISTE ACCOUNT PARA ESSE EMAIL: ${JSON.stringify(koroneikiAccount.contactEmailAddress)}\n`);
            }


            if (dxpAccount) {
                await this.updateDXPAccount(koroneikiAccount, dxpAccount.id);
                await this.linkUserToAccount(koroneikiAccount, dxpAccount.id);
                dxpAccountUpdated = await this.updateDXPAccount(koroneikiAccount, dxpAccount.id);
            } else {
                const response = await this.createDxpAccount(koroneikiAccount);
                console.log("🚀 ~ KoroneikAccountSync ~ main ~ response:", response)
                // await this.linkUserToAccount(koroneikiAccount, response.id);
                dxpAccountUpdated = await this.createDxpAccount(koroneikiAccount);
            }


            console.log("🚀 ~ KoroneikAccountSync ~ main ~ dxpAccount:", dxpAccount)


        }
    }
}

const koroneikAccountSync = new KoroneikAccountSync();
// await koroneikAccountSync.getkoroneikAccounts(accountFilter); // Ajustar
// await koroneikAccountSync.getDXPAccounts(1, 100)

koroneikAccountSync.main();

