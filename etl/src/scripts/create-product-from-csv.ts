import { createProductFromCSVSchema, liferayAuthSchema } from "../schemas/zod";
import { ENV } from "../config/env";
import { logger } from "../utils/logger";
import { paths } from "../utils/paths";
import api from "../services/api";

class CreateProductFromCSV {
	constructor() {
		createProductFromCSVSchema.parse(ENV);

		if (liferayAuthSchema.parse(ENV).LIFERAY_HOST.startsWith("https")) {
			throw new Error(
				"This script is only allowed to be executed for localhost environment",
			);
		}
	}

	async run() {
		const productsRaw = await Bun.file(`${paths.csv}/products.csv`).text();

		const products = [...productsRaw.split("\n")].map((product) => {
			const [erc, id, appName] = product.split(";");

			return {
				erc,
				id,
				appName,
			};
		});

		for (const [index, product] of products.entries()) {
			await api
				.postProduct({
					active: true,
					catalogId: ENV.CATALOG_ID,
					description: {
						en_US:
							"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
					},
					externalReferenceCode: product.erc,
					name: {
						en_US: product.appName,
					},
					productType: "virtual",
					categories: [
						{
							externalReferenceCode: "a20409bf-11f6-142a-23c6-e8f5237d8606",
							id: "33823",
							name: "App",
							vocabulary: "Marketplace Product Type",
						},
					],
				})
				.catch((error) =>
					logger.error(
						`${index} - Failed to create ${product.appName}` + error,
					),
				);

			logger.info(`${index} - Created product ${product.appName}`);
		}
	}
}

const createProductFromCSV = new CreateProductFromCSV();

await createProductFromCSV.run();
