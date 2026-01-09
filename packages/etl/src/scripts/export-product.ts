import '../core/SafeRunner';

import {
    getChannelProductsPage,
    PageProduct,
    Product,
    ProductSpecification,
    Sku,
} from 'liferay-headless-rest-client/headless-commerce-delivery-catalog-v1.0';

import { exportProductFileSchema } from '../schemas/zod';
import { paths } from '../utils/paths';

import PaginationRun from '../core/PaginationRun';
import { liferayClient } from '../services/liferay';
import CSV from '../core/CSV';
import { ENV } from '../config/env';

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
                sort: 'name:asc',
                accountId: '-1',
                nestedFields: 'categories,productSpecifications,skus,images',
                page: `${page}`,
                pageSize: `${pageSize}`,
                'skus.accountId': '-1',
            },
        });

        return response.data as PageProduct;
    }

    private async processCSV() {
        const headers = [
            {
                name: 'name',
                label: 'Name',
            },
            {
                name: 'urls',
                label: 'URL',
                render: (urls: Product['urls']) =>
                    `${ENV.LIFERAY_HOST}/p/${urls?.en_US}`,
            },
            {
                name: 'productSpecifications',
                render: (productSpecifications: ProductSpecification[]) =>
                    productSpecifications
                        .filter(
                            ({ specificationKey }) =>
                                specificationKey === 'liferay-version',
                        )
                        .map(({ value }) => value)
                        .join('\n'),
                label: 'Portal Version',
            },
            {
                name: 'productSpecifications',
                render: (productSpecifications: ProductSpecification[]) =>
                    productSpecifications
                        .filter(
                            ({ specificationKey }) =>
                                specificationKey === 'type',
                        )
                        .map(({ value }) => value),
                label: 'App Type',
            },
            {
                name: 'currencyCode',
                label: 'Currency Code',
                render: () => 'USD',
            },
            {
                name: 'productSpecifications',
                render: (
                    productSpecifications: ProductSpecification[],
                    { skus }: Product,
                ) => {
                    const priceModel = productSpecifications.find(
                        ({ specificationKey }) =>
                            specificationKey === 'price-model',
                    );

                    if (priceModel?.value === 'Free') {
                        return 'Free';
                    }

                    return skus
                        ?.filter(({ purchasable }) => purchasable)
                        .map(({ price, sku, skuOptions }) => ({
                            price: price?.priceFormatted,
                            sku,
                            skuOption:
                                skuOptions?.at(0)?.skuOptionValueNames?.[0],
                        }))
                        .map(
                            ({ price, sku, skuOption = sku }) =>
                                `${skuOption} - ${price}`,
                        )
                        .join('\n');
                },
                label: 'Price',
            },
            {
                name: 'productSpecifications',
                render: (productSpecifications: ProductSpecification[]) =>
                    productSpecifications.find(
                        ({ specificationKey }) =>
                            specificationKey === 'license-type',
                    )?.value,
                label: 'License Type',
            },
        ];

        const csv = new CSV(headers, this.products);

        await csv.save('product.csv');
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
            images: product?.images?.map(
                ({ customFields, ...image }: any) => image,
            ),
        });
    }
}

const exportProductFile = new ExportProductFile();

await exportProductFile.run(1, 100);
