import {
    getOrdersPage,
    Order,
} from 'liferay-headless-rest-client/headless-commerce-admin-order-v1.0';
import { SearchBuilder } from 'odata-search-builder';
import CSV from '../core/CSV';
import PaginationRun from '../core/PaginationRun';
import '../core/SafeRunner';
import { liferayClient } from '../services/liferay';
import { safeJSONParse } from '../utils/json';
import { logger } from '../utils/logger';

class ExportLiferayProducts {
    private orders: Order[] = [];

    async runAiHub() {
        const self = this;
        const paginationRun = new PaginationRun();

        await paginationRun.dryRun<Order>(
            {
                async processItem(order: Order) {
                    self.orders.push(order);
                },

                async processFinished() {
                    const csv = new CSV(
                        [
                            { name: 'id', label: 'Order ID' },
                            {
                                name: 'creatorEmailAddress',
                                label: 'Creator Email Address',
                            },
                            {
                                name: 'account',
                                label: 'Account Name',
                                render: (account) => account.name,
                            },
                            {
                                name: 'customFields',
                                label: 'AI HUB Account Name',
                                render: (customFields) => {
                                    const orderMetadata = safeJSONParse(
                                        customFields['order-metadata'],
                                        { aiHubForm: { aiHubAccountName: '' } },
                                    );

                                    return orderMetadata?.aiHubForm
                                        ?.aiHubAccountName;
                                },
                            },
                            {
                                name: 'customFields',
                                label: 'AI Hub Email Address',
                                render: (customFields) => {
                                    const orderMetadata = safeJSONParse(
                                        customFields['order-metadata'],
                                        {
                                            aiHubForm: {
                                                businessEmail: '',
                                                businessEmailAddress: '',
                                            },
                                        },
                                    );

                                    return (
                                        orderMetadata?.aiHubForm
                                            ?.businessEmailAddress ||
                                        orderMetadata?.aiHubForm?.businessEmail
                                    );
                                },
                            },
                        ],
                        self.orders,
                    );

                    await csv.save('ai-hub.csv');
                },
                fetchData: (page, pageSize) =>
                    getOrdersPage({
                        client: liferayClient,
                        query: {
                            filter: SearchBuilder.in(
                                'orderTypeExternalReferenceCode',
                                ['AI_HUB'],
                            ),
                            nestedFields: 'account',
                            page: `${page}`,
                            pageSize: `${pageSize}`,
                        },
                    })
                        .then((response) => response.data)
                        .catch((error) => {
                            logger.error(error);

                            return {
                                items: [],
                            };
                        }),
            },
            { page: 1, pageSize: 20 },
        );

        logger.info('Processed finished');
    }

    async runDXPFree() {
        const self = this;
        const paginationRun = new PaginationRun();

        await paginationRun.dryRun<Order>(
            {
                async processItem(order: Order) {
                    self.orders.push(order);
                },

                async processFinished() {
                    const csv = new CSV(
                        [
                            { name: 'id', label: 'Order ID' },
                            {
                                name: 'creatorEmailAddress',
                                label: 'Creator Email Address',
                            },
                            {
                                name: 'account',
                                label: 'Account Name',
                                render: (account) => account.name,
                            },
                            {
                                name: 'customFields',
                                label: 'Domain',
                                render: (customFields) => {
                                    const orderMetadata = safeJSONParse(
                                        customFields['order-metadata'],
                                        { dxpTypeFreeForm: { domain: '' } },
                                    );

                                    return orderMetadata?.dxpTypeFreeForm
                                        ?.domain;
                                },
                            },
                        ],
                        self.orders,
                    );

                    await csv.save('dxp-free.csv');
                },
                fetchData: (page, pageSize) =>
                    getOrdersPage({
                        client: liferayClient,
                        query: {
                            filter: SearchBuilder.in(
                                'orderTypeExternalReferenceCode',
                                ['DXP'],
                            ),
                            nestedFields: 'account',
                            page: `${page}`,
                            pageSize: `${pageSize}`,
                        },
                    })
                        .then((response) => response.data)
                        .catch((error) => {
                            logger.error(error);

                            return {
                                items: [],
                            };
                        }),
            },
            { page: 1, pageSize: 20 },
        );

        logger.info('Processed finished');
    }
}

const exportLiferayProducts = new ExportLiferayProducts();

exportLiferayProducts.runAiHub();
