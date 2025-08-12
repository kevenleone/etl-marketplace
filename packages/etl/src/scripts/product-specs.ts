import config from "../config";
import api from "../services/api";
import { Product } from "../types";

class ProductSpecifications {
    processedProducts = 0;

    async processProductSKU(product: Product) {
        ++this.processedProducts;
    }

    async run(page = 1, pageSize = 50) {
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
            const productTypes = product.categories
                .filter(
                    ({ vocabulary }) =>
                        vocabulary === "marketplace-product-type"
                )
                .map(({ name }) => name);

            if (productTypes.length) {
                console.log(
                    "OK",
                    product.externalReferenceCode,
                    product.id,
                    product.name.en_US,
                    "-->",
                    productTypes.join(", ")
                );
            } else {
                console.warn(
                    "NOT OK",
                    product.externalReferenceCode,
                    product.id,
                    product.name.en_US,
                    "Product without type"
                );
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

const productSpecifications = new ProductSpecifications();

productSpecifications.run();
