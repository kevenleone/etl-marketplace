import '../core/SafeRunner';

import {
    getChannelProductsPage,
    PageProduct,
    Product,
} from 'liferay-headless-rest-client/headless-commerce-delivery-catalog-v1.0';

import { exportProductFileSchema } from '../schemas/zod';
import { paths } from '../utils/paths';

import PaginationRun from '../core/PaginationRun';
import { liferayClient } from '../services/liferay';

const env = exportProductFileSchema.parse(import.meta.env);

class ExportProductFile extends PaginationRun<Product> {
    processedProducts = 0;
    products: Product[] = [];

    protected async fetchData(
        page: number,
        pageSize: number,
    ): Promise<PageProduct> {
        const response = await getChannelProductsPage({
            client: liferayClient,
            path: { channelId: env.CHANNEL_ID },
            query: {
                nestedFields:
                    'attachments,productOptions,productSpecifications,images,categories,attachments.accountId=-1',
                page: `${page}`,
                pageSize: `${pageSize}`,
            },
        });

        return response.data as PageProduct;
    }

    protected async processFinished(): Promise<void> {
        this.logger.info('Finished, saving the file products.json');

        await Bun.write(
            `${paths.json}/products.json`,
            JSON.stringify(this.products),
        );
    }

    protected async processItem(product: Product): Promise<void> {
        this.products.push({
            ...product,
            images: product!.images!.map(
                ({ customFields, ...image }: any) => image,
            ),
        });
    }
}

const exportProductFile = new ExportProductFile();

await exportProductFile.run(1, 100);
