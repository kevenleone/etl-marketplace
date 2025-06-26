import ky from "ky";
import config from "../config";
import api from "../services/api";
import { Product } from "../types";

class KoroneikiSync {
    processedProducts = 0;

    async processProductSKU(product: Product) {
        const allSkusWithValidKoroneikiReference = product.skus.every(
            ({ externalReferenceCode }) =>
                externalReferenceCode.startsWith("KOR-")
        );

        const skusName = product.skus
            .map(
                ({ sku, externalReferenceCode }) =>
                    `${sku}-${externalReferenceCode}`
            )
            .join(", ");

        if (allSkusWithValidKoroneikiReference) {
            return console.log(
                "Already processed:",
                product.id,
                product.name.en_US,
                skusName
            );
        }

        ++this.processedProducts;

        let key = "Processed";

        try {
            const response = await ky.post(
                `${import.meta.env.SPRING_BOOT_URL}/koroneiki/product/${
                    product.id + 1
                }`,
                { timeout: 30000 }
            );
            if (!response.ok) {
                console.log(response);

                throw new Error("Something went wrong");
            }
        } catch (error) {
            key = "Error to Process";
        }

        console.log(
            key,
            product.id,
            product.name.en_US,
            skusName,
            allSkusWithValidKoroneikiReference
        );
    }

    async run(page = 1, pageSize = 20) {
        const response = await api.getProducts(page, pageSize);

        const { items: products, ...productResponse } = await response.json<{
            page: number;
            lastPage: number;
            items: Product[];
        }>();

        console.log(
            `Start Processing - Page: ${productResponse.page}/${productResponse.lastPage}`
        );

        for (const product of products) {
            const isPaidApp = product.productSpecifications.some(
                ({ specificationKey, value: { en_US: specificationValue } }) =>
                    specificationKey === "price-model" &&
                    specificationValue === "Paid"
            );

            const isDXPApp = product.productSpecifications.some(
                ({ specificationKey, value: { en_US: specificationValue } }) =>
                    specificationKey === "type" &&
                    specificationValue?.toLowerCase()?.trim() === "dxp"
            );

            if (isDXPApp && isPaidApp) {
                await this.processProductSKU(product);
            }
        }

        if (productResponse.page === productResponse.lastPage) {
            console.log("Processed Products", this.processedProducts);
        } else {
            await this.run(page + 1, pageSize);
        }
    }
}

console.log("Starting:", config.OAUTH_HOST, new Date());

const koroneikiSync = new KoroneikiSync();

koroneikiSync.run();
