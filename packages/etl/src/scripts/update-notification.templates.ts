import { $ } from 'bun';
import fs from 'fs';
import {
    getNotificationTemplatesPage,
    NotificationTemplate,
    patchNotificationTemplate,
    postNotificationTemplate,
} from 'liferay-headless-rest-client/notification-v1.0';

import {
    getObjectDefinitionsPage,
    ObjectAction,
    ObjectDefinition,
    patchObjectAction,
    postObjectDefinitionObjectAction,
} from 'liferay-headless-rest-client/object-admin-v1.0';

import { paths } from '../utils/paths';
import { logger } from '../utils/logger';
import { liferayClient } from '../services/liferay';

function extractObjectDefinitionId(value: string): string {
    return value.replace(/\[\$OBJECT_DEFINITION_ID:([^$]+)\$\]/, '$1');
}

type TransformedNotificationTemplate = {
    body: string;
    objectActions: any[];
    template: any;
};

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
            const basePath = `${paths.emailPackage}/emails/notification-templates/${notificationTemplate}`;
            const notificationTemplatePath = `${basePath}/notification-template.json`;

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

            const objectActionsPath = `${basePath}/notification-template.object-actions.json`;

            transformedNotificationTemplates.push({
                body: await Bun.file(indexHtmlPath).text(),
                objectActions: fs.existsSync(objectActionsPath)
                    ? await Bun.file(objectActionsPath).json()
                    : [],
                template,
            });
        }

        return transformedNotificationTemplates as TransformedNotificationTemplate[];
    }

    static async syncObjectActions(
        notificationTemplate: NotificationTemplate,
        objectActions: TransformedNotificationTemplate['objectActions'],
        objectDefinitions: ObjectDefinition[],
    ) {
        for (const objectAction of objectActions) {
            const objectDefinitionName = extractObjectDefinitionId(
                objectAction.objectDefinitionId,
            );

            delete objectAction.objectDefinitionId;

            const objectDefinition = objectDefinitions.find(
                (objectDefinition) =>
                    objectDefinition.name === objectDefinitionName,
            );

            if (!objectDefinition) {
                logger.warn(
                    `[syncObjectActions] Object Definition "${objectDefinitionName}" not found`,
                );

                continue;
            }

            const existingObjectAction = objectDefinition.objectActions?.find(
                ({ externalReferenceCode }) =>
                    externalReferenceCode ===
                    objectAction.externalReferenceCode,
            );

            if (existingObjectAction) {
                const { data, error } = await patchObjectAction({
                    body: {
                        ...existingObjectAction,
                        ...objectAction,
                        parameters: {
                            ...existingObjectAction.parameters,
                            ...objectAction.parameters,
                            notificationTemplateId: notificationTemplate.id,
                        },
                    },
                    client: liferayClient,
                    path: { objectActionId: String(existingObjectAction.id) },
                });

                if (error) {
                    logger.error(
                        `[syncObjectActions] Unable to update "${existingObjectAction.label?.en_US}" Object Action`,
                    );

                    console.error(error);
                }

                continue;
            }

            const { error } = await postObjectDefinitionObjectAction({
                body: {
                    ...objectAction,
                    parameters: {
                        ...objectAction.parameters,
                        notificationTemplateId: notificationTemplate.id,
                    },
                },
                client: liferayClient,
                path: { objectDefinitionId: String(objectDefinition.id) },
            });

            if (error) {
                logger.error(
                    `[syncObjectActions] Unable to create Object Action "${objectAction.label?.en_US}" for Object Definition: "${objectDefinition.label?.en_US}"`,
                );

                console.error(error);
            }
        }
    }

    static async run() {
        const [{ data, error }, { data: objectDefinitionPage }] =
            await Promise.all([
                getNotificationTemplatesPage({
                    client: liferayClient,
                    query: { pageSize: '-1' },
                }),
                getObjectDefinitionsPage({
                    client: liferayClient,
                    query: { pageSize: '-1' },
                }),
            ]);

        const objectDefinitions = objectDefinitionPage?.items ?? [];

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
                        body: {
                            en_US: notificationTemplate.body,
                        },
                    },
                    client: liferayClient,
                    path: {
                        notificationTemplateId:
                            existingNotificationTemplate.id!.toString(),
                    },
                });

                await this.syncObjectActions(
                    existingNotificationTemplate,
                    notificationTemplate.objectActions,
                    objectDefinitions,
                );

                continue;
            }

            logger.info(
                `[run] Creating | ${notificationTemplate.template.name}`,
            );

            const { data: newNotificationTemplate } =
                await postNotificationTemplate({
                    body: {
                        ...notificationTemplate.template,
                        body: {
                            en_US: notificationTemplate.body,
                        },
                    },
                    client: liferayClient,
                });

            await this.syncObjectActions(
                newNotificationTemplate as NotificationTemplate,
                notificationTemplate.objectActions,
                objectDefinitions,
            );
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
