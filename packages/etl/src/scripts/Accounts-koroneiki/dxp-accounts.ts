import { getAccountsPage } from 'liferay-headless-rest-client/headless-admin-user-v1.0';
import { liferayClient } from '../../services/liferay';
import { Account } from './types';

class ExportAccounts {
    accounts: Account[] = [];

    constructor() {
        this.accounts = [];
    }

    async fetchData(page: number, pageSize: number): Promise<any> {
        const response = await getAccountsPage({
            client: liferayClient,
            query: {
                nestedFields: 'customFields,postalAddresses,userAccount',
                page: page.toString(),
                pageSize: pageSize.toString(),
            },
        });

        return response.data;
    }

    async run(page = 1, pageSize = 50) {
        const { items: accounts } = await this.fetchData(page, pageSize);
         this.accounts.push(...(accounts as Account[]));

        console.log(this.accounts);
        await this.export();
    }

    async export() {
        await Bun.write(
            './packages/etl/src/scripts/Accounts-koroneiki/accounts.json',
            JSON.stringify(this.accounts, null, 2),
        );
    }
}

const exportAccounts = new ExportAccounts();

await exportAccounts.run(1, 50);


