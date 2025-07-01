import "../core/SafeRunner";

import PaginationRun from "../core/PaginationRun";
import { liferayClient } from "../services/liferay";
import {
    getAccountsPage,
    PageAccount,
    Account,
    CustomField,
    getAccountPostalAddressesPage,
} from "liferay-headless-rest-client/headless-admin-user-v1.0";
import {
    getCatalogsPage,
    Catalog,
} from "liferay-headless-rest-client/headless-commerce-admin-catalog-v1.0";
import { paths } from "../utils/paths";
import SearchBuilder from "../core/SearchBuilder";

function escapeCSV(value: any) {
    if (value == null) {
        return "";
    }

    const str = String(value);

    if (str.includes('"') || str.includes(",") || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
    }

    return str;
}

class ExportAccounts extends PaginationRun<PageAccount> {
    private publisherDetails: any[] = [];

    constructor(protected catalogs: Catalog[]) {
        super();
    }

    protected async fetchData(
        page: number,
        pageSize: number
    ): Promise<PageAccount> {
        const response = await getAccountsPage({
            client: liferayClient,
            query: {
                filter: SearchBuilder.eq("type", "supplier"),
                page: page.toString(),
                pageSize: pageSize.toString(),
            },
        });

        return response.data as PageAccount;
    }

    async getAccountPostalAddress(accountId: string) {
        const { data } = await getAccountPostalAddressesPage({
            client: liferayClient,
            path: { accountId },
        });

        if (data?.totalCount === 0) {
            return "";
        }

        const {
            streetAddressLine1 = "",
            addressLocality = "",
            addressRegion = "",
            postalCode = "",
            addressCountry = "",
        } = data?.items?.[0] || {};

        return `${streetAddressLine1}, ${addressLocality}, ${addressRegion}, ${postalCode}, ${addressCountry}`.trim();
    }

    private getCustomFieldValue(customFields: CustomField[], name: string) {
        return customFields?.find((field) => field?.name === name)?.customValue
            ?.data;
    }

    async processItem(account: Required<Account>) {
        const catalog = this.catalogs.find(
            (catalog) => account.id === catalog.accountId
        );

        if (!catalog) {
            return console.error("Catalog not found", account.name);
        }

        console.log(`Processing ${account.name}`);

        const customFields = account.customFields || [];

        this.publisherDetails.push({
            accountId: account.id,
            catalogId: catalog.id,
            description: account.description || "",
            emailAddress: this.getCustomFieldValue(
                customFields,
                "Contact Email"
            ),
            location: await this.getAccountPostalAddress(String(account.id)),
            publisherName: account.name,
            publisherProfileImage: account.logoURL,
            websiteURL: this.getCustomFieldValue(customFields, "Homepage URL"),
        });
    }

    async processFinished() {
        for (const publisherDetail of this.publisherDetails) {
            console.log(
                publisherDetail.publisherName,
                publisherDetail.catalogId
            );
        }

        const columns = [
            "accountId",
            "catalogId",
            "publisherName",
            "emailAddress",
            "websiteURL",
            "description",
            "location",
            "publisherProfileImage",
        ];

        const csvContent = [
            columns.join(","),
            ...this.publisherDetails.map((supplier) =>
                columns.map((field) => escapeCSV(supplier[field])).join(",")
            ),
        ].join("\n");

        await Bun.write(`${paths.csv}/publisherDetails.csv`, csvContent);

        await Bun.write(
            `${paths.json}/publisherDetails.json`,
            JSON.stringify(this.publisherDetails)
        );

        console.log("Total Accounts", this.publisherDetails.length);
    }
}

async function main() {
    const { data } = await getCatalogsPage({
        client: liferayClient,
        query: {
            page: "1",
            pageSize: "500",
        },
    });

    const catalogs = data?.items || [];

    const exportAccounts = new ExportAccounts(catalogs);

    await exportAccounts.run(1, 50);
}

main();
