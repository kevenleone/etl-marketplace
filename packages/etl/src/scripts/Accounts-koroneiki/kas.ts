import { koroneikiApi } from "../../services/koroneikiApi";

const accountFilter =
    "entitlements/any(s:contains(s, 'Subscription') or s eq 'Partner')";

class KoroneikAccountSync {
    constructor() { }

    async getKoroneikiAccountsPage(page = 1, pageSize = 100) {
        const response = await koroneikiApi.getKoroneikiAccountsPage(page, pageSize, accountFilter);

        await Bun.write('./packages/etl/src/scripts/Accounts-koroneiki/koroneiki-accounts.json', JSON.stringify(response, null, 2));
    }

    async run() {
        this.getKoroneikiAccountsPage(1, 100);
    }
}

const koroneikiAccountSync = new KoroneikAccountSync();

await koroneikiAccountSync.run();