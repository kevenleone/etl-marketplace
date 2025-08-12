import fs from "node:fs";
import ora from "ora";

import config from "../../config";
import { marketplace } from "../../services/marketplace";
import { path, paths } from "../../utils/paths";
import { downloadSchema } from "../../schemas/zod";
import { sanitize } from "../../utils/sanitize";

class Download {
    private developerFolder = paths.developer;
    private downloadFolder = paths.download;
    private processImages = false;

    constructor() {
        downloadSchema.parse(config.download);
    }

    getLPKGName(folder: string, title: string) {
        return `${folder}/${sanitize(title)}.lpkg`;
    }

    async downloadDeveloperDocuments(
        developerEntryId: string,
        developerDocuments: any,
        developerImages: any
    ) {
        const folder = `${this.developerFolder}/${developerEntryId}`;

        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder);
        }

        if (!developerDocuments[developerEntryId]) {
            return;
        }

        for (const developerDocument of developerDocuments[developerEntryId]) {
            continue;

            await this.download({
                filePath: `${folder}/${developerDocument.filename}`,
                url: `${config.download.marketplaceportletpage}?p_p_id=21_WAR_osbportlet&p_p_lifecycle=2&p_p_state=normal&p_p_mode=view&p_p_resource_id=serveMedia&p_p_cacheability=cacheLevelPage&p_p_col_id=column-2&p_p_col_count=1&_21_WAR_osbportlet_assetAttachmentId=${developerDocument.assetAttachmentId}`,
            });
        }

        if (!developerImages[developerEntryId]) {
            return;
        }

        await this.download(
            this.getDownloadImagePath({
                filePath: `${folder}/${developerImages[developerEntryId].filename}`,
                assetAttachmentId:
                    developerImages[developerEntryId].attachmentId,
                isIcon: false,
            })
        );
    }

    getDownloadImagePath({
        filePath,
        assetAttachmentId,
        isIcon,
    }: {
        filePath: string;
        assetAttachmentId: string;
        isIcon: boolean;
    }) {
        return {
            filePath,
            url: isIcon
                ? `${config.download.marketplaceportletpage}?p_p_id=21_WAR_osbportlet&p_p_lifecycle=2&p_p_state=normal&p_p_mode=view&p_p_resource_id=serveIcon&p_p_cacheability=cacheLevelPage&p_p_col_id=column-2&p_p_col_count=1&_21_WAR_osbportlet_assetAttachmentId=${assetAttachmentId}`
                : `${config.download.marketplaceportletpage}?p_p_id=21_WAR_osbportlet&p_p_lifecycle=2&p_p_state=normal&p_p_mode=view&p_p_resource_id=serveMedia&p_p_cacheability=cacheLevelPage&p_p_col_id=column-2&p_p_col_count=1&_21_WAR_osbportlet_assetAttachmentId=${assetAttachmentId}`,
        };
    }

    async download({
        filePath,
        url,
    }: ReturnType<typeof this.getDownloadImagePath>) {
        const fileExists = await Bun.file(filePath).exists();

        if (fileExists) {
            return console.info(
                `----> Skipping download, ${filePath} already exists`
            );
        }

        const response = await marketplace.get(url);

        const contentDisposition = response.headers.get("content-disposition");

        if (!contentDisposition) {
            console.log(url, response.status, response.headers);

            return console.error(
                "----> Missing Content-Disposition header while downloading"
            );
        }

        await Bun.write(filePath, await response.blob());
    }

    async downloadFiles(extractedApp: any) {
        const appDirectory = `${this.downloadFolder}/${extractedApp.appEntryId}`;
        const imagesDirectory = `${appDirectory}/images`;

        if (!fs.existsSync(appDirectory)) {
            fs.mkdirSync(appDirectory);
        }

        if (!fs.existsSync(imagesDirectory)) {
            fs.mkdirSync(imagesDirectory);
        }

        for (const image of extractedApp.images) {
            if (!this.processImages) {
                break;
            }

            try {
                const title = extractedApp.title
                    .replace("*", "")
                    .replace("/", "");

                const filePath =
                    `${imagesDirectory}/${title}-${image.assetAttachmentId}-${image.filename}`.replaceAll(
                        " ",
                        ""
                    );

                await this.download(
                    this.getDownloadImagePath({
                        filePath,
                        assetAttachmentId: image.assetAttachmentId,
                        isIcon: !!image.icon,
                    })
                );
            } catch (error) {
                console.log(
                    `Unable to process image ${image.filename}, error: `,
                    error
                );
            }
        }

        if (!extractedApp.versionEntries) {
            return `No Version Entries found for ${extractedApp.title}`;
        }

        if (!extractedApp.versionEntries[extractedApp["latestAppVersionId"]]) {
            return `Latest Version missing for ${extractedApp.title}`;
        }

        await this.processZip(extractedApp, appDirectory);
    }

    async processZip(extractedApp: any, parentFolder: string) {
        const latestAppVersion =
            extractedApp.versionEntries[extractedApp.latestAppVersionId];

        const { version } = latestAppVersion;

        for (const pkg of latestAppVersion.packages) {
            const { assetAttachmentId, appPackageId, buildNumber } = pkg;

            try {
                await this.download({
                    filePath: this.getLPKGName(
                        parentFolder + `/packages`,
                        `${extractedApp.title}-${buildNumber}`
                    ),
                    url: `${config.download.marketplaceportletpage}?p_p_id=21_WAR_osbportlet&p_p_lifecycle=2&p_p_state=normal&p_p_mode=view&p_p_resource_id=serveApp&p_p_cacheability=cacheLevelPage&p_p_col_id=column-2&p_p_col_count=1&_21_WAR_osbportlet_appPackageId=${appPackageId}&_21_WAR_osbportlet_version=${version}&_21_WAR_osbportlet_portalBuildNumber=${buildNumber}`,
                });
            } catch (error) {
                console.error(`Unable to process download lpkg: ${error}`);
            }

            try {
                if (assetAttachmentId) {
                    await this.download({
                        filePath: `${parentFolder}/source_code/${pkg.fileName}`,
                        url: `${config.download.marketplacecontrolpanelpage}?p_p_id=8_WAR_osbportlet&p_p_lifecycle=2&p_p_state=normal&p_p_mode=view&p_p_resource_id=serveAppPackageSrc&p_p_cacheability=cacheLevelPage&p_p_col_id=column-2&p_p_col_count=1&_8_WAR_osbportlet_assetAttachmentId=${assetAttachmentId}`,
                    });
                }
            } catch (error) {
                console.error(`Unable to process download src: ${error}`);
            }
        }
    }

    async run() {
        const [developerEntries, extractedApps] = await Promise.all([
            Bun.file(
                path.join(paths.data, "extracted_developer_entries.json")
            ).json(),
            Bun.file(path.join(paths.data, "extracted_apps.json")).json(),
        ]);

        const developerEntryIds = new Set<string>();

        const developerDocuments: {
            [key: string]: any;
        } = {};

        const developerImages: {
            [key: string]: {
                attachmentId: string;
                filename: string;
            };
        } = {};

        for (const {
            developerEntryId,
            developerLogoId,
            ...developerEntry
        } of developerEntries) {
            if (developerLogoId) {
                developerImages[developerEntryId] = {
                    attachmentId: developerLogoId,
                    filename: developerEntry.image_filename,
                };
            }

            if (developerEntry.documents) {
                developerDocuments[developerEntryId] = developerEntry.documents;
            }
        }

        if (!fs.existsSync(this.downloadFolder)) {
            fs.mkdirSync(this.downloadFolder);
        }

        if (!fs.existsSync(this.developerFolder)) {
            fs.mkdirSync(this.developerFolder);
        }

        let i = 1;

        for (const extractedApp of extractedApps) {
            const spinner = ora(
                `Downloading files ${i}/${extractedApps.length} for: ${extractedApp.title}`
            ).start();

            const start = new Date().getTime();

            try {
                await this.downloadFiles(extractedApp);

                spinner.succeed(
                    `Downloading files ${i}/${extractedApps.length} for: ${
                        extractedApp.title
                    } - ${new Date().getTime() - start}ms`
                );

                developerEntryIds.add(extractedApp.developerEntryId);
            } catch (error) {
                spinner.fail();

                console.error(`Unable to process ${extractedApp.title}`);
            }

            i++;
        }

        let j = 1;

        for (const developerEntryId of developerEntryIds) {
            console.log(
                `Downloading Developer Documents ${j}/${developerEntryIds.size} for: ${developerEntryId}`
            );

            await this.downloadDeveloperDocuments(
                developerEntryId,
                developerDocuments,
                developerImages
            );

            j++;
        }
    }
}

const download = new Download();

download.run();
