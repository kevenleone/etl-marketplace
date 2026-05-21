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
    async runAiHub() {
        const paginationRun = new PaginationRun();
        const orders: Order[] = [];

        await paginationRun.dryRun<Order>(
            {
                async processItem(order: Order) {
                    orders.push(order);
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
                                        customFields?.['order-metadata'],
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
                                        customFields?.['order-metadata'],
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
                        orders,
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

    async runCMPBeta() {
        const paginationRun = new PaginationRun();
        const orders: Order[] = [];

        await paginationRun.dryRun<Order>(
            {
                async processItem(order: Order) {
                    orders.push(order);
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
                            }
                        ],
                        orders,
                    );

                    await csv.save('cmp-beta.csv');
                },
                fetchData: (page, pageSize) =>
                    getOrdersPage({
                        client: liferayClient,
                        query: {
                            filter: SearchBuilder.in(
                                'orderTypeExternalReferenceCode',
                                ['CMP_BETA'],
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

    async runDSR() {
        const paginationRun = new PaginationRun();
        const orders: Order[] = [];

        await paginationRun.dryRun<Order>(
            {
                async processItem(order: Order) {
                    orders.push(order);
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
                                label: 'Project Name',
                                render: (customFields) => {
                                    const orderMetadata = safeJSONParse(
                                        customFields?.['order-metadata'],
                                        { analyticsProject: { name: '' } },
                                    );

                                    return orderMetadata?.analyticsProject
                                        ?.name;
                                },
                            },
                            {
                                name: 'customFields',
                                label: 'Server Location',
                                render: (customFields) => {
                                    const orderMetadata = safeJSONParse(
                                        customFields?.['order-metadata'],
                                        { analyticsProject: { serverLocation: '' } },
                                    );

                                    return orderMetadata?.analyticsProject
                                        ?.serverLocation;
                                },
                            },
                            {
                                name: 'customFields',
                                label: 'Incident Report Email Addresses',
                                render: (customFields) => {
                                    const orderMetadata = safeJSONParse(
                                        customFields?.['order-metadata'],
                                        { analyticsProject: { incidentReportEmailAddresses: [] } },
                                    );

                                    return orderMetadata?.analyticsProject
                                        ?.incidentReportEmailAddresses?.join(', ');
                                },
                            }
                        ],
                        orders,
                    );

                    await csv.save('dsr.csv');
                },
                fetchData: (page, pageSize) =>
                    getOrdersPage({
                        client: liferayClient,
                        query: {
                            filter: SearchBuilder.in(
                                'orderTypeExternalReferenceCode',
                                ['DSR'],
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
        const paginationRun = new PaginationRun();
        const orders: Order[] = [];

        await paginationRun.dryRun<Order>(
            {
                async processItem(order: Order) {
                    orders.push(order);
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
                                        customFields?.['order-metadata'],
                                        { dxpTypeFreeForm: { domain: '' } },
                                    );

                                    return orderMetadata?.dxpTypeFreeForm
                                        ?.domain;
                                },
                            },
                        ],
                        orders,
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

await exportLiferayProducts.runAiHub();
await exportLiferayProducts.runDSR();
await exportLiferayProducts.runCMPBeta();
await exportLiferayProducts.runDXPFree();
