import "../core/SafeRunner";

import { z } from "zod";
import { OSB_PortalRelease } from "@prisma/client";
import * as fs from "fs/promises";

import { ENV } from "../config/env";
import { migrateProductVersionSchema } from "../schemas/zod";
import { path, paths } from "../utils/paths";
import {
	APIResponse,
	Product,
	ProductPage,
	ProductSpecification,
} from "../types";
import { logger } from "../utils/logger";
import api from "../services/api";
import Prisma from "../core/Prisma";
import SearchBuilder from "../core/SearchBuilder";

const DOCUMENTS_ROOT_FOLDER = 0;
const DOWNLOAD_FOLDER = paths.download;
const PACKAGE_FOLDER_NAME = "packages";
const PICK_LIST_ASSET_TYPE = "sourceCode";
const PUBLISHER_ASSETS_FOLDER = "publisher_assets";
const SOURCE_CODE_FOLDER_NAME = "source_code";
const SPECIFICATION_LIFERAY_VERSION_KEY = "liferay-version";

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
	) {}

	static async getAssetFolderId() {
		const documentFoldersResponse = await api.getDocumentFolders(
			env.SITE_ID,
			new URLSearchParams({
				filter: SearchBuilder.contains("name", PUBLISHER_ASSETS_FOLDER),
			}),
		);

		const {
			items: [firstFolder],
		} = await documentFoldersResponse.json<APIResponse>();

		if (firstFolder) {
			return firstFolder?.id;
		}

		const createFolderResponse = await api.createDocumentFolder(
			PUBLISHER_ASSETS_FOLDER,
			DOCUMENTS_ROOT_FOLDER,
		);

		return createFolderResponse?.id;
	}

	async createVirtualItem(
		product: Product,
		productVirtualSettingsFileEntries: any,
	) {
		const productId = product.productId as number;
		try {
			await api.updateProduct(productId, {
				productVirtualSettings: {
					productVirtualSettingsFileEntries,
				},
			});
		} catch (error) {
			for (const virtualEntry of productVirtualSettingsFileEntries) {
				const blob = new Blob([virtualEntry.attachment]);

				const productVirtualSettingsFileEntries =
					product?.productVirtualSettings?.productVirtualSettingsFileEntries ||
					[];

				let virtualSettingsId: number = product?.productVirtualSettings
					?.id as number;

				const alreadyCreatedEntry = productVirtualSettingsFileEntries.filter(
					(alreadyCreatedVirtualEntry) =>
						alreadyCreatedVirtualEntry.version === virtualEntry.version,
				);

				if (!alreadyCreatedEntry.length) {
					const virtualSettings = {
						version: virtualEntry.version,
					};

					const formData = new FormData();

					if (!virtualSettingsId) {
						// Creating Product Virtual Setting

						await api.updateProduct(productId, {
							productVirtualSettings: {},
						});

						const productResponse = await api.getProductById(productId);

						virtualSettingsId = productResponse?.productVirtualSettings
							?.id as number;
					}

					formData.append("file", blob, virtualEntry.filename);
					formData.append(
						"productVirtualSettingsFileEntry",
						JSON.stringify(virtualSettings),
					);

					await api
						.createProductVirtualEntry(virtualSettingsId, formData)
						.then(() =>
							this.logger.info(
								`Virtual entry ${virtualEntry.version} created individually`,
							),
						)
						.catch(() =>
							this.logger.error("Unable to process virtual items individually"),
						);
				}
			}
		}
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
			path.join(entryPath, PACKAGE_FOLDER_NAME),
		);

		if (!hasExtractedFolder) {
			return this.logger.info("No LPKGs to process");
		}

		const lpkgs = await fs.readdir(path.join(entryPath, PACKAGE_FOLDER_NAME));

		const productVirtualSettingsFileEntries: {
			attachment: string;
			filename: string;
			version: string;
		}[] = [];

		let versionNameSpecification: string[] = [];

		for (const lpkg of lpkgs) {
			const lpkgBuildNumber = this.getLPKGBuildNumber(lpkg);

			const liferayVersion = this.portalReleases.find(
				(release) => release.buildNumber?.toString() === lpkgBuildNumber,
			);

			const versionName = liferayVersion?.versionName as string;

			if (!liferayVersion) {
				this.logger.error(`Version ${lpkgBuildNumber} Not found`);

				continue;
			}

			const attachment = await fs.readFile(
				path.join(entryPath, PACKAGE_FOLDER_NAME, lpkg),
				{ encoding: "base64" },
			);

			productVirtualSettingsFileEntries.push({
				attachment,
				filename: lpkg,
				version: versionName,
			});

			const { productId, productSpecifications } = product;

			const liferayVersions = productSpecifications.filter(
				(specification) =>
					specification.specificationKey ===
						SPECIFICATION_LIFERAY_VERSION_KEY &&
					specification.value.en_US === versionName,
			);

			if (!liferayVersions.length) {
				if (
					!versionNameSpecification.find(
						(item) => item === this.getVersionNumber(versionName),
					)
				) {
					await api.createProductSpecification(Number(productId), {
						id: this.liferayVersionSpecification.id,
						specificationKey: SPECIFICATION_LIFERAY_VERSION_KEY,
						value: {
							en_US: this.getVersionNumber(versionName),
						},
					});
				}

				versionNameSpecification.push(this.getVersionNumber(versionName));

				this.logger.info(`Specification ${versionName} created`);

				continue;
			}

			// this.logger.info(`Specification ${versionName} already exists`);
		}

		await this.createVirtualItem(product, productVirtualSettingsFileEntries)
			.then(() => this.logger.info("virtual entry created"))
			.catch(async () => this.logger.error("Unable to process virtual items"));
	}

	async processSourceCode(entryPath: string, product: Product) {
		const sourceCodeFiles = await fs.readdir(
			path.join(entryPath, SOURCE_CODE_FOLDER_NAME),
		);

		for (const sourceCodeFile of sourceCodeFiles) {
			const file = Bun.file(
				path.join(entryPath, SOURCE_CODE_FOLDER_NAME, sourceCodeFile),
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
				}),
			);

			let publisherFolderId = hasSourceCodeFolder?.id;

			if (!hasSourceCodeFolder) {
				const createFolderResponse = await api.createDocumentFolder(
					publisherFolderName,
					this.assetFolderId as unknown as number,
				);

				publisherFolderId = createFolderResponse?.id;
			}

			const { items } = await api.getDocumentFolderDocuments(publisherFolderId);

			const document = items.find(
				(document) => document.fileName === sourceCodeFile,
			);

			let documentId = document?.id;

			if (!documentId) {
				const sourceDocument = await api.createDocumentFolderDocument(
					publisherFolderId,
					formData,
				);

				documentId = sourceDocument.id;

				this.logger.info(`Document Folder ${product.name.en_US} created`);
			}

			await api
				.createPublisherAsset({
					name: product.name.en_US,
					publisherAssetType: PICK_LIST_ASSET_TYPE,
					r_accountEntryToPublisherAssets_accountEntryId:
						product?.catalog?.accountId,
					r_productEntryToPublisherAssets_CPDefinitionId:
						product.id as unknown as string,
					sourceCode: documentId,
					version: "PLEASE_FIX_ME",
				})
				.then(() =>
					this.logger.info(`Publisher Asset ${product.name.en_US} created`),
				)
				.catch((error) =>
					this.logger.error(
						`Error to process Publisher Asset - ${product.name.en_US} / ${
							(error as Error).message
						}`,
					),
				);
		}
	}

	async processFolders(product: Product) {
		const appEntryId = product.externalReferenceCode;
		const entryPath = path.join(DOWNLOAD_FOLDER, appEntryId);

		const entryPathExists = await fs.exists(entryPath);

		if (!entryPathExists) {
			// this.logger.info(`Folder not found for ${appEntryId}`);

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
		const response = await api.getProducts(page, pageSize);

		const { items: products, ...productResponse } =
			await response.json<ProductPage>();

		console.log(
			`Start Processing - Page: ${productResponse.page}/${productResponse.lastPage}`,
		);

		for (const product of products) {
			this.logger = logger.child(logger.bindings(), {
				msgPrefix: `${this.processedProducts}, ${product.name.en_US} - `,
			});

			this.logger.info("");

			await this.processFolders(product);

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
	(specification) => specification.key === SPECIFICATION_LIFERAY_VERSION_KEY,
);

const migrateProductVersions = new MigrateProductVersions(
	publisherAssetFolderId,
	liferayVersionSpecification as ProductSpecification,
	portalReleases,
);

await migrateProductVersions.run();
await Prisma.$disconnect();

logger.info("Finished");

process.exit();
