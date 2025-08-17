import api from '../services/api';
import { logger } from '../utils/logger';
import { paths } from '../utils/paths';

class CreatePublisherDetails {
    constructor(private publisherDetails: any[]) {}

    async run() {
        const log = [];

        logger.info('Starting proccessing ...');

        logger.info('Reading publisher details from JSON file ...');

        const publisherDetails =
            (await Bun.file(`${paths.json}/publisherDetails.json`).json()) ||
            [];

        for (const publisherDetail of publisherDetails) {
            if (
                this.publisherDetails.find(
                    (item) =>
                        item.publisherName.trim() ===
                        publisherDetail.publisherName.trim(),
                )
            ) {
                logger.info(
                    `SKIPPING - publisher details for ${publisherDetail.publisherName} already exists...`,
                );

                log.push({
                    status: 'skipped',
                    message: `Publisher details for ${publisherDetail.publisherName} already exists.`,
                    publisher: publisherDetail,
                });

                continue;
            }

            try {
                logger.info(
                    `CREATING - publisher details for ${publisherDetail.publisherName} ...`,
                );

                await api.createPublisherDetails({
                    catalogId: publisherDetail.catalogId,
                    description: publisherDetail.description,
                    emailAddress: publisherDetail.emailAddress,
                    publisherName: publisherDetail.publisherName.trim(),
                    publisherProfileImage:
                        publisherDetail.publisherProfileImage,
                    r_accountToPublisherDetails_accountEntryId:
                        publisherDetail?.accountId,
                    showContactForm: false,
                    websiteURL: publisherDetail.websiteURL,
                });

                log.push({
                    status: 'success',
                    message: `Publisher details for ${publisherDetail.publisherName} created successfully.`,
                    publisher: publisherDetail,
                });
            } catch (error) {
                logger.error(
                    `Error creating publisher details for ${publisherDetail.publisherName}:`,
                    error,
                );

                log.push({
                    status: 'error',
                    message:
                        error instanceof Error ? error.message : String(error),
                    publisher: publisherDetail,
                });
            }
        }

        await Bun.write(
            `${paths.logs}/publisherDetails.json`,
            JSON.stringify(log),
        );

        logger.info('Processing completed.');
    }
}

async function main() {
    const data = await api.getPublisherDetails(
        new URLSearchParams({
            page: '1',
            pageSize: '500',
        }),
    );

    const publisherDetails = data?.items || [];

    const createPublisherDetails = new CreatePublisherDetails(publisherDetails);

    await createPublisherDetails.run();
}

main();
