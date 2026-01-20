import { koroneikiApi } from '../services/koroneikiApi';
import api from '../services/api';

const accountFilter =
    "entitlements/any(s:contains(s, 'Subscription') or s eq 'Partner')";

class KoroneikAccountSync {
    constructor() {}

    async createUserAccount() {
        const response = '';
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

    async koroneikAccounts(filters?: string) {
        const response = await koroneikiApi.getKoroneikiAccounts(filters);

        const items = await Promise.all(
            response.items.map(async (item: any) => {
                let address = item?.postalAddresses
                    ? [...item.postalAddresses]
                    : [];

                if (!address.length) {
                    const addressResponse =
                        await koroneikiApi.getKoroneikiPostalAddress(item.key);

                    address = addressResponse.items;
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

        return items;
    }

    async main() {
        const accounts = await this.koroneikAccounts(accountFilter);

        Promise.all(
            accounts.map(async (account: any) => {
                await this.createAccount({
                    name: account.name,
                    externalReferenceCode: account.externalReferenceCode,
                    type: 'business',
                });
            }),
        );
    }
}

const test = new KoroneikAccountSync();

test.main();
