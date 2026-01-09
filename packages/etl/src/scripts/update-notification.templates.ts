import { $ } from 'bun';
import fs from 'fs';
import {
    getNotificationTemplatesPage,
    patchNotificationTemplate,
    postNotificationTemplate,
} from 'liferay-headless-rest-client/notification-v1.0';

import { paths } from '../utils/paths';
import { logger } from '../utils/logger';
import { liferayClient } from '../services/liferay';

class UpdateNotificationTemplates {
    static async exportTemplates() {
        logger.info('[exportTemplates] Exporting React Email Templates');

        await $`cd ${paths.emailPackage} && bun run export`.quiet();

        logger.info('[exportTemplates] Export completed');
    }

    static async getNotificationTemplates() {
        const notificationTemplates =
            await $`cd ${paths.emailPackage}/emails/notification-templates && ls`.quiet();

        return notificationTemplates.stdout.toString().trim().split('\n');
    }

    static async transformNotificationTemplates() {
        const notificationTemplates = await this.getNotificationTemplates();
        const transformedNotificationTemplates = [];

        for (const notificationTemplate of notificationTemplates) {
            const notificationTemplatePath = `${paths.emailPackage}/emails/notification-templates/${notificationTemplate}/notification-template.json`;

            if (!fs.existsSync(notificationTemplatePath)) {
                logger.info(
                    `[transformNotificationTemplates] "${notificationTemplate}" notification-template.json not found`,
                );

                continue;
            }

            const template = await Bun.file(notificationTemplatePath).json();

            const indexHtmlPath = `${paths.emailPackage}/out/notification-templates/${notificationTemplate}/index.html`;

            if (!fs.existsSync(indexHtmlPath)) {
                logger.info(
                    `[transformNotificationTemplates] "${notificationTemplate}" index.html not found`,
                );

                continue;
            }

            transformedNotificationTemplates.push({
                body: await Bun.file(indexHtmlPath).text(),
                template,
            });
        }

        return transformedNotificationTemplates;
    }

    static async run() {
        const { data, error } = await getNotificationTemplatesPage({
            client: liferayClient,
            query: { pageSize: '-1' },
        });

        if (error) {
            throw new Error(error as any);
        }

        await this.exportTemplates();

        const notificationTemplates =
            await this.transformNotificationTemplates();

        for (const notificationTemplate of notificationTemplates) {
            const existingNotificationTemplate = data?.items?.find(
                (item) =>
                    item.externalReferenceCode ===
                    notificationTemplate.template.externalReferenceCode,
            );

            if (existingNotificationTemplate) {
                logger.info(
                    `[run] Updating | ${notificationTemplate.template.name}`,
                );

                await patchNotificationTemplate({
                    body: {
                        ...existingNotificationTemplate,
                        ...notificationTemplate.template,
                        body: { en_US: notificationTemplate.body },
                    },
                    client: liferayClient,
                    path: {
                        notificationTemplateId:
                            existingNotificationTemplate.id!.toString(),
                    },
                });

                continue;
            }

            logger.info(
                `[run] Creating | ${notificationTemplate.template.name}`,
            );

            await postNotificationTemplate({
                body: {
                    ...notificationTemplate.template,
                    body: { en_US: notificationTemplate.body },
                },
                client: liferayClient,
            });

            continue;
        }

        const diff = data?.items
            ?.filter(
                (item) =>
                    !notificationTemplates?.find(
                        (notificationTemplate) =>
                            item.externalReferenceCode ===
                            notificationTemplate.template.externalReferenceCode,
                    ),
            )
            .map(
                ({ externalReferenceCode, name }, index) =>
                    `${index}. ${name} - ${externalReferenceCode}`,
            );

        logger.info(`[run] Templates not processed: \n\n${diff?.join('\n')}`);
        logger.info(
            `[run] Templates processed: ${notificationTemplates.length}, skipped: ${diff?.length}`,
        );
    }
}

await UpdateNotificationTemplates.run();
