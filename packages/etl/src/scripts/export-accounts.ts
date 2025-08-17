import {
    Account,
    PageAccount,
    getAccountsPage,
} from 'liferay-headless-rest-client/headless-admin-user-v1.0';

import { liferayClient } from '../services/liferay';
import PaginationRun from '../core/PaginationRun';
import { paths } from '../utils/paths';

class ExportAccounts extends PaginationRun<PageAccount> {
    private accounts: Account[] = [];

    protected async fetchData(
        page: number,
        pageSize: number,
    ): Promise<PageAccount> {
        const response = await getAccountsPage({
            client: liferayClient,
            query: { page: String(page), pageSize: String(pageSize) },
        });

        return response.data as PageAccount;
    }

    async processItem(account: Required<Account>) {
        if (!account.externalReferenceCode.includes('KOR-')) {
            return;
        }

        delete (account as Partial<Account>).company;

        this.accounts.push(account);
    }

    async processFinished() {
        for (const account of this.accounts) {
            console.log(account.externalReferenceCode, account.name);
        }

        console.log('Total Accounts', this.accounts.length);

        await Bun.write(
            `${paths.json}/accounts.json`,
            JSON.stringify(this.accounts),
        );
    }
}

new ExportAccounts().run(1, 50);
