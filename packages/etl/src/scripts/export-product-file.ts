import { exportProductFileSchema } from "../schemas/zod";
import { paths } from "../utils/paths";
import { Product } from "../types";
import api from "../services/api";
import PaginationRun from "../core/PaginationRun";

const env = exportProductFileSchema.parse(import.meta.env);

class ExportProductFile extends PaginationRun<Product> {
    processedProducts = 0;
    products: Product[] = [];

    constructor() {
        super((page, pageSize) =>
            api.getDeliveryProducts(env.CHANNEL_ID, page, pageSize)
        );
    }

    protected async processFinished(): Promise<void> {
        this.logger.info("Finished, saving the file products.json");

        await Bun.write(
            `${paths.json}/products.json`,
            JSON.stringify(this.products)
        );
    }

    protected async processItem(product: Product): Promise<void> {
        this.products.push({
            ...product,
            images: product.images.map(
                ({ customFields, ...image }: any) => image
            ),
        });
    }
}

const exportProductFile = new ExportProductFile();

await exportProductFile.run(1, 100);
