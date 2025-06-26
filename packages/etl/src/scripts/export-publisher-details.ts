
import PaginationRun from "../core/PaginationRun";
import api from "../services/api";
import { Account, APIResponse, Catalog, PublisherDetails } from "../types";
import { paths } from "../utils/paths";

const getAccounts = async (page: number, pageSize: number) => {
    const response = await api.getAccounts(
        new URLSearchParams({
            filter: `type eq 'supplier'`,
            page: page.toString(),
            pageSize: pageSize.toString(),
        })
    );

    return response.json<APIResponse<Account>>();
};


class ExportAccounts extends PaginationRun<Account> {
    private publisherDetails: any[] = [];
    private catalogs: Catalog[]

    constructor(catalogs: Catalog[]) {
        super(getAccounts);
        this.catalogs = catalogs
    }

    async getAccountPostalAddress(accountId: number) {
        const accountPostalAddresses = await api.getPostalAddresses(accountId);

        const {
            streetAddressLine1 = "",
            addressLocality = "",
            addressRegion = "",
            postalCode = "",
            addressCountry = ""
        } = accountPostalAddresses[0] || {}

        return `${streetAddressLine1}, ${addressLocality}, ${addressRegion}, ${postalCode}, ${addressCountry}`.trim()
    }

    async processItem(account: Account) {
        for (const catalog of this.catalogs) {
            if (catalog.accountId === account.id && account.type === "supplier") {
                const location = await this.getAccountPostalAddress(account.id)

                this.publisherDetails.push({
                    catalogId: catalog.accountId || "",
                    description: account.description || "",
                    emailAddress: account?.customFields.find((filed) => filed.name === "Contact Email")?.customValue.data || "",
                    location,
                    publisherName: account.name,
                    publisherProfileImage: account.logoURL,
                    websiteURL: account?.customFields.find((filed) => filed.name === "Homepage URL")?.customValue.data || "",
                });
            }
        }

    }

    async processFinished() {
        for (const publisherDetail of this.publisherDetails) {
            console.log(publisherDetail.publisherName, publisherDetail.catalogId);
        }

        function escapeCSV(value: any) {
            if (value == null) return '';

            const str = String(value);

            if (str.includes('"') || str.includes(',') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }

            return str;
        }

        const fields = [
            'catalogId',
            'publisherName',
            'emailAddress',
            'websiteURL',
            'description',
            'location',
            'publisherProfileImage'
        ];

        const csvContent = [
            fields.join(','),
            ...this.publisherDetails.map(supplier =>
                fields.map(field => escapeCSV(supplier[field])).join(',')
            )
        ].join('\n');

        await Bun.write(
            `${paths.csv}/publisherDetails.csv`,
            csvContent
        );

        await Bun.write(
            `${paths.json}/publisherDetails.json`,
            JSON.stringify(this.publisherDetails)
        );

        console.log("Total Accounts", this.publisherDetails.length);

    }
}

async function main() {
    const response = await api.getCatalogs(
        new URLSearchParams({
            page: "1",
            pageSize: "500",
        })
    )

    const catalogResponse = await response.json<APIResponse<Catalog>>()

    const exportAccounts = new ExportAccounts(catalogResponse.items);

    await exportAccounts.run(1, 100);
};

main()