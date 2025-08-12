import PaginationRun from "../core/PaginationRun";
import api from "../services/api";
import { Account, APIResponse } from "../types";
import { paths } from "../utils/paths";

const getAccounts = async (page: number, pageSize: number) => {
    const response = await api.getAccounts(
        new URLSearchParams({
            fields: "externalReferenceCode,id,name",
            page: page.toString(),
            pageSize: pageSize.toString(),
        })
    );

    return response.json<APIResponse<Account>>();
};

class ExportAccounts extends PaginationRun<Account> {
    private accounts: Account[] = [];

    constructor() {
        super(getAccounts);
    }

    async processItem(account: Account) {
        if (!account.externalReferenceCode.includes("KOR-")) {
            return;
        }

        delete account.company;

        this.accounts.push(account);
    }

    async processFinished() {
        for (const account of this.accounts) {
            console.log(account.externalReferenceCode, account.name);
        }

        console.log("Total Accounts", this.accounts.length);

        await Bun.write(
            `${paths.json}/accounts.json`,
            JSON.stringify(this.accounts)
        );
    }
}

new ExportAccounts().run(1, 50);
