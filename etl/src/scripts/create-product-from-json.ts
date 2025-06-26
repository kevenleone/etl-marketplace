import { z } from "zod";

import { createProductFromJSONchema, liferayAuthSchema } from "../schemas/zod";
import { ENV } from "../config/env";
import { logger } from "../utils/logger";
import { paths } from "../utils/paths";
import api from "../services/api";
import {
    APIResponse,
    Catalog,
    Product,
    ProductSpecification,
    Vocabulary,
} from "../types";
import SearchBuilder from "../core/SearchBuilder";

/**
 * @description
 * Enforce the running of the script with the env properties
 */

const env = createProductFromJSONchema.parse(ENV);

class CreateProductFromJSON {
    env: z.infer<typeof createProductFromJSONchema>;
    logger = logger;

    constructor(
        private catalogs: Catalog[] = [],
        private specifications: ProductSpecification[] = [],
        private vocabularies: Vocabulary[] = []
    ) {
        this.env = env;
        const authSchema = liferayAuthSchema.parse(ENV);

        if (
            authSchema.LIFERAY_HOST.startsWith("https") &&
            !authSchema.LIFERAY_HOST.includes("-uat")
        ) {
            throw new Error(
                "This script is only allowed to be executed for localhost environment"
            );
        }
    }

    async getImageAsBase64(url: string) {
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        const base64Image = Buffer.from(buffer).toString("base64");

        return base64Image;
    }

    async getVersionNumber(fileName: string) {
        const version = fileName.match(/\d+\.\d+/);

        return version ? version[0] : fileName;
    }

    async createCatalog(product: Product) {
        const catalogName = product.catalogName?.replaceAll(
            "'",
            "''"
        ) as string;

        const catalogFiltered = this.catalogs.find(
            (catalog: Catalog) => catalog.name === catalogName
        );

        if (catalogFiltered) {
            return catalogFiltered;
        }

        const accountResponse = await api.getAccounts(
            new URLSearchParams({
                filter: SearchBuilder.eq("name", catalogName as string),
            })
        );

        const { items } = await accountResponse.json<APIResponse>();

        let accountId = items[0]?.id;

        if (!accountId) {
            const accountResponse = await api.createAccount({
                name: catalogName,
                type: "supplier",
            });

            const account = await accountResponse.json<{ id: number }>();

            accountId = account.id;
        }

        const response = await api.createCatalog({
            accountId,
            currencyCode: "USD",
            defaultLanguageId: "en_US",
            name: catalogName,
        });

        const catalog = await response.json<Catalog>();

        this.catalogs.push(catalog);

        return catalog;
    }

    async run() {
        const jsonProducts = await Bun.file(
            `${paths.json}/products.json`
        ).json();

        for (const [index, product] of jsonProducts.entries()) {
            this.logger = logger.child(logger.bindings(), {
                msgPrefix: `${index}, ${product.name} - `,
            });

            let catalog;
            let categories = [];
            let productSpecifications: ProductSpecification[] = [];

            const productCategories = product?.categories;

            try {
                await api.getProductByERC(product.externalReferenceCode);

                this.logger.info("already created");
            } catch (error) {
                catalog = await this.createCatalog(product);

                for (const category of productCategories) {
                    const vocabulary = this.vocabularies?.filter(
                        (vocabulary) =>
                            category.vocabulary.replaceAll("tag", "tags") ===
                                vocabulary.name
                                    .replaceAll(" ", "-")
                                    .replaceAll("tag", "tags")
                                    .toLowerCase() ||
                            category.vocabulary === vocabulary.name
                    );

                    if (vocabulary.length) {
                        const { items: categoryList } = await api.getCategories(
                            vocabulary[0]?.id
                        );

                        const filteredCategory = categoryList?.filter(
                            (categoryResponse) =>
                                category.name === categoryResponse.name
                        );

                        if (filteredCategory?.length) {
                            delete category.title;
                            categories.push({
                                ...category,
                                id: filteredCategory[0]?.id,
                                siteId: ENV.SITE_ID,
                                title: { en_US: filteredCategory[0].name },
                            });
                        }
                    }
                }

                // FILTER SPECIFICATIONS
                for (const productionSpecification of product.productSpecifications) {
                    const filteredSpecification = this.specifications.find(
                        (specification) =>
                            specification.key ===
                            productionSpecification.specificationKey
                    );

                    if (filteredSpecification) {
                        productSpecifications.push({
                            id: filteredSpecification.id,
                            specificationKey:
                                filteredSpecification?.key as string,
                            value: {
                                en_US: await this.getVersionNumber(
                                    productionSpecification.value
                                ),
                            },
                        });
                    }
                }

                await api
                    .postProduct({
                        active: true,
                        catalogId: catalog.id,
                        categories: categories,
                        description: {
                            en_US: product.description,
                        },
                        externalReferenceCode: product.externalReferenceCode,
                        name: {
                            en_US: product.name,
                        },
                        productSpecifications,
                        productType: "virtual",
                    })
                    .catch((error) =>
                        logger.error(
                            `${index} - Failed to create ${product.name}` +
                                error
                        )
                    );

                // Tentativa máxima de criação da imagem
                const maxAttempts = 3;

                for (const image of product.images) {
                    let attempt = 0;
                    let imageCreated = false;

                    while (attempt < maxAttempts && !imageCreated) {
                        try {
                            await api.createImage(
                                {
                                    attachment: await this.getImageAsBase64(
                                        image.src
                                    ),
                                    galleryEnabled: image.galleryEnabled,
                                    neverExpire: true,
                                    priority: image.priority,
                                    tags: image.tags || [],
                                    title: { en_US: image.title },
                                },
                                product.externalReferenceCode
                            );
                            imageCreated = true;
                        } catch (error) {
                            attempt++;
                            this.logger.error(
                                `${index} - Failed to create image ${image.title} (Attempt ${attempt} of ${maxAttempts}): ` +
                                    error
                            );

                            if (attempt >= maxAttempts) {
                                this.logger.error(
                                    `${index} - Exceeded max attempts for image ${image.title}. Moving to next image.`
                                );
                            }
                        }
                    }
                }

                this.logger.info("created");
            }
        }
    }
}

const searchParams = new URLSearchParams({ pageSize: "300" });

// Trigger the Authentication
await api.myUserAccount();

const [catalogsResponse, specificationResponse, vocabulariesResponse] =
    await Promise.all([
        api.getCatalogs(searchParams),
        api.getSpecification(searchParams),
        api.getTaxonomyVocabularies(ENV.SITE_ID as string),
    ]);

const { items: catalogs } = await catalogsResponse.json<APIResponse>();
const { items: specifications } = await specificationResponse.json<
    APIResponse<ProductSpecification>
>();
const { items: vocabularies } = await vocabulariesResponse.json<APIResponse>();

const createProductFromJSON = new CreateProductFromJSON(
    catalogs,
    specifications,
    vocabularies
);

await createProductFromJSON.run();
