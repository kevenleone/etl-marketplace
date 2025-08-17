import "../core/SafeRunner";

import {
    Order,
    getOrdersPage,
} from "liferay-headless-rest-client/headless-commerce-admin-order-v1.0";

import { ENV } from "../config/env";
import { liferayAuthSchema } from "../schemas/zod";
import PaginationRun from "../core/PaginationRun";
import { paths } from "../utils/paths";
import { SearchBuilder } from "odata-search-builder";
import { liferayClient } from "../services/liferay";

const authSchema = liferayAuthSchema.parse(ENV);

function getTopOrders(orderCounts: any, topN = 5) {
    return Object.entries(orderCounts)
        .sort((a: any, b: any) => b[1] - a[1]) // Sort by count in descending order
        .slice(0, topN) // Take the top N entries
        .map(([product, count]) => ({ product, count })); // Convert to an array of objects
}

function countOrders(orders: any[]) {
    return orders.reduce((acc, order) => {
        acc[order.productName] = (acc[order.productName] || 0) + 1;
        return acc;
    }, {});
}

class GetOrders extends PaginationRun<Order> {
    private orders: any[] = [];

    constructor() {
        super(async (page, pageSize) => {
            const { data } = await getOrdersPage({
                client: liferayClient,
                query: {
                    filter: new SearchBuilder()
                        .gt("createDate", new Date(2025, 0, 1).toISOString())
                        .and()
                        .lambda("orderStatus", 0, { unquote: true })
                        .build(),
                    nestedFields: "orderItems",
                    sort: "createDate:desc",
                    page: `${page}`,
                    pageSize: `${pageSize}`,
                },
            });

            return data;
        });
    }

    async processItem(order: Order): Promise<void> {
        this.orders.push({
            creatorEmailAddress: order.creatorEmailAddress,
            id: order.id,
            accountId: order.accountId,
            createDate: order.createDate,
            totalFormatted: order.totalFormatted,
            orderTypeExternalReferenceCode:
                order.orderTypeExternalReferenceCode,
            productName: order?.orderItems?.[0]?.name?.en_US,
            orderStatusInfo: order.orderStatusInfo,
            orderItems: order?.orderItems?.map(
                ({ totalAmount, quantity, name }) => ({
                    quantity,
                    totalAmount,
                    productName: name?.en_US,
                })
            ),
        });
    }

    protected async processFinished(): Promise<void> {
        console.log(this.orders);
        console.log(countOrders(this.orders));

        const orderSummary = countOrders(this.orders);

        await Bun.write(
            `${paths.csv}/orders.csv`,
            this.orders.map(
                (order) =>
                    [
                        order.id,
                        order.orderTypeExternalReferenceCode,
                        order.productName,
                        order.accountId,
                        order.createDate,
                        order.totalFormatted,
                        order.orderStatusInfo?.label,
                    ].join("|") + "\n"
            )
        );

        await Bun.write(
            `${paths.json}/order-summary.json`,
            JSON.stringify({
                ordersCount: orderSummary,
                topOrder: getTopOrders(orderSummary),
            })
        );

        await Bun.write(
            `${paths.json}/orders.json`,
            JSON.stringify(this.orders)
        );
    }
}

console.log("Starting:", authSchema.LIFERAY_HOST, new Date());

const getOrders = new GetOrders();

await getOrders.run(1, 200);
