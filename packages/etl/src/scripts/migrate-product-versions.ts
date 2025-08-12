import "../core/SafeRunner";

import { z } from "zod";
import { OSB_PortalRelease } from "@prisma/client";
import * as fs from "fs/promises";

import { ENV } from "../config/env";
import { migrateProductVersionSchema } from "../schemas/zod";
import { path, paths } from "../utils/paths";
import { APIResponse, Product, ProductSpecification } from "../types";
import { logger } from "../utils/logger";
import api from "../services/api";
import Prisma from "../core/Prisma";
import { SearchBuilder } from "odata-search-builder";

const DOCUMENTS_ROOT_FOLDER = 0;
const DOWNLOAD_FOLDER = paths.download;
const PACKAGE_FOLDER_NAME = "packages";
const PICK_LIST_ASSET_TYPE = "sourceCode";
const PUBLISHER_ASSETS_FOLDER = "publisher_assets";
const SOURCE_CODE_FOLDER_NAME = "source_code";
const LIFERAY_VERSION_SPECIFICATION_KEY = "liferay-version";
const LATEST_VERSION_SPECIFICATION_KEY = "latest-version";

const sleep = (timer: number) =>
    new Promise((resolve) => setTimeout(() => resolve(null), timer));

const env: z.infer<typeof migrateProductVersionSchema> =
    migrateProductVersionSchema.parse(ENV);

class MigrateProductVersions {
    private logger = logger;
    private processedProducts = 0;

    // Do not process this script if
    // the environment variables are missing

    constructor(
        private assetFolderId: string,
        private liferayVersionSpecification: ProductSpecification,
        private portalReleases: OSB_PortalRelease[],
        private productsFailed: string[]
    ) {
        this.logger.info("assetFolderId " + assetFolderId);
        this.logger.info(
            "liferayVersionSpecification " +
                JSON.stringify(liferayVersionSpecification)
        );
    }

    static async getAssetFolderId() {
        const documentFoldersResponse = await api.getDocumentFolders(
            env.SITE_ID,
            new URLSearchParams({
                filter: SearchBuilder.contains("name", PUBLISHER_ASSETS_FOLDER),
            })
        );

        const {
            items: [firstFolder],
        } = await documentFoldersResponse.json<APIResponse>();

        if (firstFolder) {
            return firstFolder?.id;
        }

        const createFolderResponse = await api.createDocumentFolder(
            PUBLISHER_ASSETS_FOLDER,
            DOCUMENTS_ROOT_FOLDER
        );

        return createFolderResponse?.id;
    }

    async createVirtualEntries(
        product: Product,
        productVirtualSettingsFileEntries: any[]
    ) {
        const productId = product.productId as number;

        for (const virtualEntry of productVirtualSettingsFileEntries) {
            const blob = new Blob([virtualEntry.attachment]);

            // const productVirtualSettingsFileEntries =
            //     product?.productVirtualSettings
            //         ?.productVirtualSettingsFileEntries || [];

            // const existingVirtualEntry = productVirtualSettingsFileEntries.find(
            //     (alreadyCreatedVirtualEntry) =>
            //         alreadyCreatedVirtualEntry.version === virtualEntry.version
            // );

            // if (existingVirtualEntry) {
            //     this.logger.warn("Virtual Entry already exists, skipping.");

            //     continue;
            // }

            let virtualSettingsId = product?.productVirtualSettings
                ?.id as number;

            if (!virtualSettingsId) {
                // Creating Product Virtual Setting

                await api.updateProduct(productId, {
                    productVirtualSettings: {},
                });

                const productResponse = await api.getProductById(productId);

                virtualSettingsId = productResponse?.productVirtualSettings
                    ?.id as number;
            }

            const formData = new FormData();

            formData.append("file", blob, virtualEntry.filename);
            formData.append(
                "productVirtualSettingsFileEntry",
                JSON.stringify({
                    version: virtualEntry.version,
                })
            );

            await api
                .createProductVirtualEntry(virtualSettingsId, formData)
                .then(() =>
                    this.logger.info(
                        `Virtual entry created: ${virtualEntry.filename}`
                    )
                )
                .catch(() => {
                    this.logger.error(
                        `Unable to process virtual item individually for ${virtualEntry.version}`
                    );
                });
        }
    }

    async createVirtualItem(
        product: Product,
        productVirtualSettingsFileEntries: any
    ) {
        const productId = product.productId as number;

        try {
            await api.updateProduct(productId, {
                productVirtualSettings: {
                    productVirtualSettingsFileEntries: [],
                },
            });

            this.logger.info("Virtual Entries cleaned");
        } catch (error) {
            this.logger.warn("Virtual items empty");
        }

        await this.createVirtualEntries(
            product,
            productVirtualSettingsFileEntries
        );
    }

    getLPKGBuildNumber(fileName: string) {
        return fileName.split("-").at(-1)?.replace(".lpkg", "");
    }

    getVersionNumber(fileName: string) {
        const version = fileName.match(/\d+\.\d+/);

        return version ? version[0] : fileName;
    }

    async processLPKGs(entryPath: string, product: Product) {
        const hasExtractedFolder = await fs.exists(
            path.join(entryPath, PACKAGE_FOLDER_NAME)
        );

        if (!hasExtractedFolder) {
            return this.logger.warn("No LPKGs to process");
        }

        const lpkgs = await fs.readdir(
            path.join(entryPath, PACKAGE_FOLDER_NAME)
        );

        const productVirtualSettingsFileEntries: {
            attachment: ArrayBuffer;
            filename: string;
            version: string;
        }[] = [];

        for (const lpkg of lpkgs) {
            const lpkgBuildNumber = this.getLPKGBuildNumber(lpkg);

            const liferayVersion = this.portalReleases.find(
                (release) => release.buildNumber?.toString() === lpkgBuildNumber
            );

            const versionName = liferayVersion?.versionName as string;

            if (!liferayVersion) {
                this.logger.error(`Version ${lpkgBuildNumber} Not found`);

                continue;
            }

            const attachment = await Bun.file(
                path.join(entryPath, PACKAGE_FOLDER_NAME, lpkg)
            ).arrayBuffer();

            const majorLiferayVersion = this.getVersionNumber(versionName);

            productVirtualSettingsFileEntries.push({
                attachment,
                filename: lpkg,
                version: versionName,
            });

            const { productId, productSpecifications } = product;

            const liferayVersionSpecification = productSpecifications.find(
                (specification) =>
                    specification.specificationKey ===
                        LIFERAY_VERSION_SPECIFICATION_KEY &&
                    specification.value.en_US === majorLiferayVersion
            );

            if (!liferayVersionSpecification) {
                const specification = await api.createProductSpecification(
                    productId as string,
                    {
                        id: this.liferayVersionSpecification.id,
                        specificationKey: LIFERAY_VERSION_SPECIFICATION_KEY,
                        value: {
                            en_US: majorLiferayVersion,
                        },
                    }
                );

                product.productSpecifications.push(specification);

                this.logger.info(
                    `Liferay Version specification ${majorLiferayVersion} created`
                );

                continue;
            }

            this.logger.info(
                `Liferay Version specification ${majorLiferayVersion} already exists`
            );
        }

        await this.createVirtualItem(
            product,
            productVirtualSettingsFileEntries
        ).catch(() => {
            this.logger.error("Unable to process virtual items");
        });
    }

    async processSourceCode(entryPath: string, product: Product) {
        const sourceCodeFiles = await fs.readdir(
            path.join(entryPath, SOURCE_CODE_FOLDER_NAME)
        );

        for (const sourceCodeFile of sourceCodeFiles) {
            const file = Bun.file(
                path.join(entryPath, SOURCE_CODE_FOLDER_NAME, sourceCodeFile)
            );

            const blob = await Bun.readableStreamToBlob(file.stream());

            const formData = new FormData();

            formData.append("file", blob, sourceCodeFile);

            const publisherFolderName = sourceCodeFile
                .replaceAll("-", "")
                .replaceAll(".", "")
                .replace("zip", "");

            const {
                items: [hasSourceCodeFolder],
            } = await api.getDocumentFolderDocumentSubFolders(
                this.assetFolderId as unknown as number,
                new URLSearchParams({
                    filter: SearchBuilder.contains("name", publisherFolderName),
                })
            );

            let publisherFolderId = hasSourceCodeFolder?.id;

            if (!hasSourceCodeFolder) {
                const createFolderResponse = await api.createDocumentFolder(
                    publisherFolderName,
                    this.assetFolderId as unknown as number
                );

                publisherFolderId = createFolderResponse?.id;
            }

            const { items } = await api.getDocumentFolderDocuments(
                publisherFolderId
            );

            const document = items.find(
                (document) => document.fileName === sourceCodeFile
            );

            let documentId = document?.id;

            if (!documentId) {
                const sourceDocument = await api.createDocumentFolderDocument(
                    publisherFolderId,
                    formData
                );

                documentId = sourceDocument.id;

                this.logger.info(
                    `Document Folder ${product.name.en_US} created`
                );
            }

            const latestVersionSpecification =
                product.productSpecifications.find(
                    (specification) =>
                        specification.specificationKey ===
                        LATEST_VERSION_SPECIFICATION_KEY
                );

            await api
                .createPublisherAsset({
                    name: product.name.en_US,
                    publisherAssetType: PICK_LIST_ASSET_TYPE,
                    r_accountEntryToPublisherAssets_accountEntryId:
                        product?.catalog?.accountId,
                    r_productEntryToPublisherAssets_CPDefinitionId:
                        product.id as unknown as string,
                    sourceCode: documentId,
                    version:
                        latestVersionSpecification?.value?.en_US || "1.0.0",
                })
                .then(() =>
                    this.logger.info(
                        `Publisher Asset ${product.name.en_US} created`
                    )
                )
                .catch((error) =>
                    this.logger.error(
                        `Error to process Publisher Asset - ${
                            product.name.en_US
                        } / ${(error as Error).message}`
                    )
                );
        }
    }

    async processFolders(product: Product) {
        const appEntryId = product.externalReferenceCode;
        const entryPath = path.join(DOWNLOAD_FOLDER, appEntryId);

        const entryPathExists = await fs.exists(entryPath);

        if (!entryPathExists) {
            this.logger.warn(
                `Folder not found for ERC ${appEntryId}, skipping folder`
            );

            return;
        }

        await this.processLPKGs(entryPath, product);

        await this.processSourceCode(entryPath, product).catch((error) => {
            if (error.code === "ENOENT") {
                // folder not found...
            }
        });
    }

    async run(page = 1, pageSize = 50) {
        const { items: products, ...productResponse } = await api.getProducts(
            page,
            pageSize
        );

        console.log(
            `Start Processing - Page: ${productResponse.page}/${productResponse.lastPage}`
        );

        for (const product of products) {
            this.logger = logger.child(logger.bindings(), {
                msgPrefix: `${this.processedProducts}, ${product.name.en_US} - `,
            });

            // this.processedProducts < 135

            if (this.productsFailed.includes(product.name.en_US.trim())) {
                this.logger.warn("Skip");
            } else {
                this.logger.info("Processing." + this.processedProducts);

                await this.processFolders(product);

                await sleep(1000);
            }

            this.processedProducts++;
        }

        if (productResponse.page === productResponse.lastPage) {
            return logger.info("Processed Products", this.processedProducts);
        }

        await this.run(page + 1, pageSize);
    }
}

await api.myUserAccount();

const [specificationResponse, publisherAssetFolderId, portalReleases] =
    await Promise.all([
        api.getSpecification(new URLSearchParams({ pageSize: "100" })),
        MigrateProductVersions.getAssetFolderId(),
        Prisma.oSB_PortalRelease.findMany(),
    ]);

const response = await specificationResponse.json<APIResponse<any>>();

const { items: specifications } = response;

const liferayVersionSpecification = specifications.find(
    (specification) => specification.key === LIFERAY_VERSION_SPECIFICATION_KEY
);

const productsFailed = await Bun.file(
    path.join(paths.json, "products-failed.json")
).json();

const migrateProductVersions = new MigrateProductVersions(
    publisherAssetFolderId,
    liferayVersionSpecification as ProductSpecification,
    portalReleases,
    productsFailed
);

await migrateProductVersions.run(1, 50);
await Prisma.$disconnect();

logger.info("Finished");

process.exit();
