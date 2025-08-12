import { z } from "zod";

import { exportProductIdsSchema } from "../schemas/zod";
import { logger } from "../utils/logger";
import { paths } from "../utils/paths";
import api from "../services/api";

class ExportProductFileById {
    env: z.infer<typeof exportProductIdsSchema>;

    constructor() {
        this.env = exportProductIdsSchema.parse(import.meta.env);
    }

    async run() {
        const productsIds = this.env.PRODUCT_IDS.split(",");

        const items = await Promise.all(
            productsIds.map(async (productId: string) => {
                const response = await api.getDeliveryProductById(
                    this.env.CHANNEL_ID as string,
                    productId
                );

                return response.json();
            })
        );

        const products = items.map(
            ({ customFields: _customFields, ...product }: any) => {
                return {
                    ...product,
                    images: product.images.map(
                        ({ customFields, ...image }: any) => image
                    ),
                };
            }
        );

        logger.info("Finished, saving the file products.json");

        return Bun.write(
            `${paths.json}/products-by-ids.json`,
            JSON.stringify(products)
        );
    }
}

logger.info("Starting");

const exportProductFileById = new ExportProductFileById();

await exportProductFileById.run();
