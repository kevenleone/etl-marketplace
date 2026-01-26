import { KoroneikiContact } from '../scripts/koroneiki-accounts/types';
import { APIResponse } from '../types';
import koroneikiClient from './koroneiki';

export const koroneikiApi = {
    async getKoroneikiAccountsPage(
        page: number,
        pageSize: number,
        filter?: string,
    ): Promise<any> {
        const searchParams = new URLSearchParams();

        searchParams.set('page', page.toString());
        searchParams.set('pageSize', pageSize.toString());

        if (filter) {
            searchParams.set('filter', filter);
        }

        const response = await koroneikiClient.fetch(
            `o/koroneiki-rest/v1.0/accounts?${searchParams.toString()}`,
        );

        return await response.json();
    },

    async getKoroneikiAccounts(searchParams: URLSearchParams): Promise<any> {
        const response = await koroneikiClient.fetch(
            `o/koroneiki-rest/v1.0/accounts?${searchParams.toString()}`,
        );

        return await response.json();
    },

    async getKoroneikiAccountContacts(
        accountKey: string,
    ): Promise<APIResponse<KoroneikiContact>> {
        const response = await koroneikiClient.fetch(
            `o/koroneiki-rest/v1.0/accounts/${accountKey}/contacts`,
        );

        return response.json();
    },

    async getKoroneikiUserAccounts(): Promise<any> {
        const response = await koroneikiClient.fetch(
            `o/headless-admin-user/v1.0/user-accounts`,
        );

        return await response.json();
    },

    async getKoroneikiPostalAddress(accountKey: string): Promise<any> {
        const response = await koroneikiClient.fetch(
            `o/koroneiki-rest/v1.0/accounts/${accountKey}/postal-addresses`,
        );

        return await response.json();
    },
};
