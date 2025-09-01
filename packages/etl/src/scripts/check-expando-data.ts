import { Product } from 'liferay-headless-rest-client/headless-commerce-delivery-catalog-v1.0';

import { paths } from '../utils/paths';

function isArrayInvalid(expandoValue: Array<string>) {
    return (
        expandoValue.length === 0 ||
        expandoValue.every((value) => value === 'false')
    );
}

async function run() {
    const products = (await Bun.file(
        `${paths.json}/products.json`,
    ).json()) as Product[];

    const processedProducts = [];

    const expandoMapCount: {
        [key: string]: number;
    } = {};

    const [firstProduct] = products;

    for (const key in firstProduct.expando) {
        expandoMapCount[key] = 0;
    }

    for (const product of products) {
        delete product.expando?.['Import Create Date'];
        delete product.expando?.['Import Modified Date'];
        delete product.expando?.['Import Status Date'];

        for (const expandoKey in product.expando) {
            const expandoValue = product.expando[expandoKey];

            if (
                !expandoValue ||
                (expandoValue as unknown as string) === 'null' ||
                (Array.isArray(expandoValue) && isArrayInvalid(expandoValue))
            ) {
                delete product.expando[expandoKey];

                continue;
            }

            expandoMapCount[expandoKey] += 1;
        }

        const finalExpandoCount = Object.keys(product.expando ?? {}).length;

        if (finalExpandoCount > 0) {
            processedProducts.push({
                name: product.name,
                finalExpandoCount,
                expando: product.expando,
            });
        }
    }

    console.log(
        JSON.stringify(
            {
                productsCount: products.length,
                productsProcessed: processedProducts.length,
                processedProducts,
            },
            null,
            4,
        ),
    );
}

run();
