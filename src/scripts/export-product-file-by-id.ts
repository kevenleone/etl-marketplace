import { z } from "zod";

import { exportProductFileSchema } from "../schemas/zod";
import { logger } from "../utils/logger";
import { paths } from "../utils/paths";
import { Product } from "../types";
import api from "../services/api";
import { productIds } from "../utils/productsIds";

class ExportProductFileById {
    env: z.infer<typeof exportProductFileSchema>;
    products: Product[] = [];

    constructor() {
        this.env = exportProductFileSchema.parse(import.meta.env);
    }

    async run(productsId:string[]) {
            const responses = await Promise.all(
            productsId.map(async (productId: string) => {
                const response = await api.getDeliveryProductById(
                    this.env.CHANNEL_ID as string,
                    productId,
                );

                return response.json();
            }))
            
            const items = responses;
        
            items.forEach(({ customFields: _customFields, ...product}:any) => {
            this.products.push({
                ...product,
                images: product.images.map(
                    ({ customFields, ...image }: any) => image
                ),
            });
        });
        
        logger.info("Finished, saving the file products.json");
            
            return Bun.write(
                `${paths.json}/products.json`,
                JSON.stringify(this.products)
            );
        
    }
}

logger.info("Starting");

const exportProductFileById = new ExportProductFileById();

await exportProductFileById.run(productIds);
