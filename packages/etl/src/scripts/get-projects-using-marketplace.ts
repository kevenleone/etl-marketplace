import PaginationRun from "../core/PaginationRun";
import { SearchBuilder } from "odata-search-builder";
import api from "../services/api";
import { Order } from "../types";
import { paths } from "../utils/paths";

class GetProjectsUsingMarketplace extends PaginationRun<Order> {
    private orders: Order[] = [];
    private koroneikiAccounts = new Set();

    constructor() {
        super((page, pageSize) =>
            api.getOrders(
                new URLSearchParams({
                    filter: SearchBuilder.gt(
                        "createDate",
                        new Date(2025, 0, 1).toISOString()
                    ),
                    nestedFields: "account,orderItems",
                    page: page.toString(),
                    pageSize: pageSize.toString(),
                    sort: "createDate:desc",
                })
            )
        );
    }

    async processItem(order: Order) {
        if (!order.accountExternalReferenceCode?.startsWith("KOR-")) {
            return;
        }

        this.koroneikiAccounts.add(order.accountExternalReferenceCode);
        this.orders.push(order);
    }

    async processFinished() {
        const ordersMap = {} as any;

        for (const koroneikiAccount of this.koroneikiAccounts) {
            const orders = this.orders
                .filter(
                    (order) =>
                        order.accountExternalReferenceCode === koroneikiAccount
                )
                .map((order) => ({
                    accountName: order.account.name,
                    creatorEmailAddress: order.creatorEmailAddress,
                    id: order.id,
                    product: order.orderItems[0].name?.en_US,
                    orderTypeExternalReferenceCode:
                        order.orderTypeExternalReferenceCode,
                }));

            ordersMap[koroneikiAccount] = {
                accountName: orders[0].accountName,
                ordersCount: orders.length,
                orders,
            };
        }

        const projectsUsingMarketplaceApps = Object.keys(ordersMap);

        await Bun.write(
            `${paths.json}/projects-using-marketplace.json`,
            JSON.stringify({
                data: ordersMap,
                summary: {
                    projectsUsingMarketplaceApps,
                    projectsUsingMarketplaceAppsCount:
                        projectsUsingMarketplaceApps.length,
                },
            })
        );

        console.log(ordersMap);
    }
}

new GetProjectsUsingMarketplace().run(1, 200);
