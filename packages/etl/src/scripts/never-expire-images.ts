import api from "../services/api";
import { ExpiredAttachemnts, Product } from "../types";

class NeverExpireImages {
    processedImages = 0;
    processedProducts = 0;

    async runNeverExpireProduct(classNameId: string, page = 1, pageSize = 60) {
        const response = await api.getProducts(page, pageSize);
        const productResponse = await response.json<{
            page: number;
            lastPage: number;
            items: Product[];
        }>();

        console.log(
            `Start Processing - Page: ${productResponse.page}/${productResponse.lastPage}`
        );

        for (const product of productResponse.items) {
            const expiredAttachemntResponse = await api.getExpiredAttachments(
                Number(classNameId),
                product.id
            );

            const expiredImages = await expiredAttachemntResponse.json<
                ExpiredAttachemnts[]
            >();

            if (expiredImages.length) {
                this.processedProducts++;
                for (const expiredImage of expiredImages) {
                    const {
                        CDNEnabled: cdnEnabled,
                        CDNURL: cdnURL,
                        CPAttachmentFileEntryId: id,
                        displayDate,
                        externalReferenceCode,
                        fileEntryId,
                        galleryEnabled,
                        priority,
                        titleCurrentValue,
                        type,
                    } = expiredImage;

                    const isAppIcon = titleCurrentValue
                        .toLowerCase()
                        .startsWith("upload");

                    let newPriority = priority;

                    if (isAppIcon) {
                        newPriority = 0;
                    } else if (!isAppIcon && priority === 0) {
                        newPriority = 1;
                    } else {
                        newPriority = priority + 1;
                    }

                    try {
                        const productImageResponse = await api.postProductImage(
                            product.productId,
                            {
                                customFields: [],
                                cdnEnabled,
                                cdnURL,
                                id,
                                displayDate: new Date(
                                    displayDate
                                ).toISOString(),
                                externalReferenceCode,
                                fileEntryId,
                                galleryEnabled,
                                options: {},
                                priority: newPriority,
                                title: { en_US: titleCurrentValue },
                                type,
                                tags:
                                    isAppIcon && priority === 0
                                        ? ["app icon"]
                                        : [],
                                neverExpire: true,
                            }
                        );

                        console.log(
                            new Date(),
                            product.id,
                            product.name.en_US,
                            "--->",
                            expiredImage.titleCurrentValue,
                            productImageResponse.ok
                        );

                        this.processedImages++;
                    } catch (error) {
                        console.log(`Unable to process ${product.id}`, error);
                    }
                }
            }
        }

        if (productResponse.page === productResponse.lastPage) {
            return;
        }

        await this.runNeverExpireProduct(classNameId, page + 1, pageSize);
    }

    async run() {
        const classnameResponse = await api.getFetchClassName();
        const className = await classnameResponse.json<{
            classNameId: string;
        }>();

        console.log("Start processing - never expire images", className);

        try {
            await this.runNeverExpireProduct(className.classNameId);
        } finally {
            console.log("Finished");
            console.log("Processed Products", this.processedProducts);
            console.log("Processed Images", this.processedImages);
        }
    }
}

const neverExpireImages = new NeverExpireImages();

neverExpireImages.run();
