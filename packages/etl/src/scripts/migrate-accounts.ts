import { SearchBuilder } from "odata-search-builder";
import api from "../services/api";
import { APIResponse } from "../types";

class MigrateAcconts {
    async runMigration(page = 1, pageSize = 20) {
        const accountsResponse = await api.getAccounts(
            new URLSearchParams({
                page: page.toString(),
                pageSize: pageSize.toString(),
                filter: SearchBuilder.contains("name", "Publisher"),
            })
        );

        const response = await accountsResponse.json<
            APIResponse<{ id: number; name: string; type: string }>
        >();

        for (const account of response.items) {
            const childAccountResponse = await api.getAccounts(
                new URLSearchParams({
                    page: "1",
                    filter: SearchBuilder.eq(
                        "name",
                        `${account.name.replace("[Publisher] ", "")} -`
                    ),
                })
            );

            const childAccounts = await childAccountResponse.json<
                APIResponse<{ id: number; name: string; type: string }>
            >();

            const newName = account.name.replace("[Publisher] ", "");

            console.log(account.id, {
                newName,
                parentAccount: {
                    id: account.id,
                    name: account.name,
                    type: account.type,
                },
                childAccountsCount: childAccounts.totalCount,
                childAccounts: childAccounts.items.map((childAccount) => ({
                    id: childAccount.id,
                    name: childAccount.name,
                    type: childAccount.type,
                })),
            });

            for (const childAccount of childAccounts.items) {
                const response = await api.updateAccount(childAccount.id, {
                    name: newName,
                });

                if (response.ok) {
                    console.log(
                        childAccount.id,
                        childAccount.name,
                        "renamed to",
                        newName
                    );
                }
            }

            const accountDeleteResponse = await api.deleteAccount(account.id);

            console.log(
                account.id,
                account.name,
                "Account Deletion",
                accountDeleteResponse.ok
            );
        }

        if (response.page === response.lastPage) {
            return;
        }

        await this.runMigration(page + 1, pageSize);
    }

    async run() {
        try {
            console.log(new Date(), "Starting Migration");

            await this.runMigration();
        } finally {
            console.log(new Date(), "Finished");
        }
    }
}

const migrateAccounts = new MigrateAcconts();

migrateAccounts.run();
