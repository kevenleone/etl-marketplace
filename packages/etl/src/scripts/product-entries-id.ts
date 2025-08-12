import api from "../services/api";
import { Product } from "../types";
import { path, paths } from "../utils/paths";

const APP_ENTRY_UUID_KEY = "app-entry-uuid";
const LIFERAY_VERSION_SPECIFICATION = "liferay-version";

class ProductEntryIds {
    entries: Map<string, string> = new Map();
    processedProducts = 0;

    async init() {
        const file = await Bun.file(
            path.join(paths.csv, "appEntry.csv")
        ).text();

        const entries = file.split("\n").map((entry) => {
            const [key, value] = entry.split(";");
            return [value, key];
        });

        const data = new Map<string, string>([...entries] as any);

        this.entries = data;
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
            const productName = product.name.en_US;
            const productSpecifications = product.productSpecifications;

            const entry = this.entries.get(productName);

            const hasLiferayVersion = productSpecifications.some(
                ({ specificationKey, value }) =>
                    specificationKey === LIFERAY_VERSION_SPECIFICATION && value
            );

            if (hasLiferayVersion) {
                console.log("Liferay Version Already Processed", productName);

                continue;
            } else {
                console.log("Processing", product.id, productName);

                const productCategories = product.categories.reduce(
                    (specifications: string[], category) => {
                        if (
                            category.vocabulary ===
                            "marketplace liferay version"
                        ) {
                            specifications.push(category.name);
                        }
                        return specifications;
                    },
                    []
                );

                for (const productCategory of productCategories) {
                    await api.postSpecification(product.productId, {
                        specificationKey: LIFERAY_VERSION_SPECIFICATION,
                        value: {
                            en_US: productCategory,
                        },
                    });
                }
            }

            const hasAppEntryUuid = productSpecifications.some(
                ({ specificationKey, value }) =>
                    specificationKey === APP_ENTRY_UUID_KEY && value
            );

            if (!entry) {
                console.log("Entry not found", productName);

                continue;
            }

            if (hasAppEntryUuid) {
                console.log("Already Processed", productName);

                continue;
            }

            this.processedProducts++;

            console.log("Processing", product.id, productName, "-->", entry);

            await api.postSpecification(product.id, {
                specificationKey: APP_ENTRY_UUID_KEY,
                value: {
                    en_US: entry,
                },
            });
        }

        if (productResponse.page === productResponse.lastPage) {
            console.log("Processed Products", this.processedProducts);
        } else {
            await this.run(page + 1, pageSize);
        }
    }
}

const productEntryIds = new ProductEntryIds();

productEntryIds.init().then(() => productEntryIds.run());
