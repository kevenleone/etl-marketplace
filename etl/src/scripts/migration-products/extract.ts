import mysql2, { Connection } from "mysql2/promise";
import xmlJs from "xml-js";
import config from "../../config";
import { path, paths } from "../../utils/paths";

class Extract {
    public connection: Connection = null as unknown as Connection;

    public categoriesMap: Map<string, string> = new Map();
    public appVersionMap: Map<string, any> = new Map();
    public appVersionEntryMap: Map<string, any> = new Map();
    public appEditionMap: Map<string, any> = new Map();
    public developerDocumentsMap: Map<string, any> = new Map();
    public developerImagesMap: Map<string, any> = new Map();
    public imagesMap: Map<string, any> = new Map();
    public appTermsMap: Map<string, string> = new Map();
    public priceMap: Map<string, any> = new Map();
    public oldEntry: any[] = [];

    private async setDBConnection() {
        this.connection = await mysql2.createConnection({
            ...config.extractDatabase,
        });
    }

    public async extractAppPrices() {
        const sql = await Bun.file(
            path.join(paths.sql, "extract_app_prices.sql")
        ).text();

        const [rows] = await this.connection.execute(sql);

        for (const row of rows as any[]) {
            const { appEntryId } = row;
            const price = row;

            if (this.priceMap.get(appEntryId)) {
                this.oldEntry = this.priceMap.get(appEntryId);
                this.oldEntry.push(price);
            } else {
                this.priceMap.set(appEntryId, [price]);
            }
        }
    }

    public async extractAppCategories() {
        const sql = await Bun.file(
            path.join(paths.sql, "extract_app_categories.sql")
        ).text();

        const [rows] = await this.connection.execute(sql);

        for (const row of rows as any[]) {
            this.categoriesMap.set(row.appEntryId, row.name);
        }
    }

    public async extractAppTerms() {
        const sql = await Bun.file(
            path.join(paths.sql, "extract_app_terms.sql")
        ).text();

        const [rows] = await this.connection.execute(sql);

        for (const row of rows as any[]) {
            this.appTermsMap.set(row.appEntryId, row.content);
        }
    }

    public async extractAppImages() {
        const sql = await Bun.file(
            path.join(paths.sql, "extract_app_images.sql")
        ).text();

        const [rows] = await this.connection.execute(sql);

        for (const {
            appEntryId,
            filename,
            assetAttachmentId,
            type_,
        } of rows as any[]) {
            const image = {
                filename,
                assetAttachmentId,
                icon: type_ == 1,
            };

            if (this.imagesMap.get(appEntryId)) {
                this.oldEntry = this.imagesMap.get(appEntryId);
                this.oldEntry.push(image);
            } else {
                this.imagesMap.set(appEntryId, [image]);
            }
        }
    }

    public async extractDeveloperDocuments() {
        const sql = await Bun.file(
            path.join(paths.sql, "extract_developer_documents.sql")
        ).text();

        const [rows] = await this.connection.execute(sql);

        for (const {
            developerEntryId,
            filename,
            assetAttachmentId,
        } of rows as any[]) {
            const document = {
                assetAttachmentId,
                filename,
            };

            if (this.developerDocumentsMap.get(developerEntryId)) {
                this.oldEntry =
                    this.developerDocumentsMap.get(developerEntryId);
                this.oldEntry.push(document);
            } else {
                this.developerDocumentsMap.set(developerEntryId, [document]);
            }
        }
    }

    public async extractDeveloperImages() {
        const sql = await Bun.file(
            path.join(paths.sql, "extract_developer_images.sql")
        ).text();

        const [rows] = await this.connection.execute(sql);

        for (const { developerEntryId, ...row } of rows as any[]) {
            if (this.developerImagesMap.get(developerEntryId)) {
                this.oldEntry = this.developerImagesMap.get(developerEntryId);
                this.oldEntry.push(row);
            } else {
                this.developerImagesMap.set(developerEntryId, [row]);
            }
        }
    }

    public async extractDeveloperEntries() {
        const sql = await Bun.file(
            path.join(paths.sql, "extract_developer_entries.sql")
        ).text();

        const [rows] = await this.connection.execute(sql);
        const records = [];

        for (const {
            profileLogoId,
            developerEntryId,
            firstName,
            lastName,
            legalEntityName,
            userId,
            dossieraAccountKey,
            type_,
            profileDescription,
            emailAddress,
            profileWebsite,
            paymentEmailAddress,
            industry,
            street1,
            street2,
            street3,
            country,
            a2,
            region,
            regionCode,
            city,
            zip,
            phoneNumber,
        } of rows as any[]) {
            const record = {
                documents: [],
                developerImage: "",
                developerProfile: "",
                developerLogoId: "",
                groupFriendlyURL: "",
                image_filename: "",
                profileLogoId: profileLogoId,
                developerEntryId: developerEntryId,
                firstName: firstName,
                lastName: lastName,
                legalEntityName: legalEntityName,
                userId: userId,
                dossieraAccountKey: dossieraAccountKey,
                type_: type_,
                profileDescription: profileDescription,
                emailAddress: emailAddress,
                profileWebsite: profileWebsite,
                paymentEmailAddress: paymentEmailAddress,
                industry: industry,
                street1: street1,
                street2: street2,
                street3: street3,
                country: country,
                a2: a2,
                region: region,
                regionCode: regionCode,
                city: city,
                zip: zip,
                phoneNumber: phoneNumber,
            };

            let developerImageMap =
                this.developerImagesMap.get(developerEntryId);

            if (Array.isArray(developerImageMap)) {
                developerImageMap = developerImageMap.at(-1);
            }

            if (developerImageMap) {
                const { url, logoId, friendlyURL, filename, description } =
                    developerImageMap;

                let _description;

                const json = JSON.parse(xmlJs.xml2json(description));

                if (json) {
                    _description = json.elements[0]?.elements.find(
                        (rootElement: any) =>
                            rootElement.name === "Description" &&
                            rootElement.attributes["language-id"] === "en_US"
                    ).elements[0]?.text;
                }

                record.developerImage = url;
                record.developerProfile = _description;
                record.developerLogoId = logoId;
                record.groupFriendlyURL = friendlyURL;
                record.image_filename = filename;
            }

            if (this.developerDocumentsMap.get(developerEntryId)) {
                record.documents =
                    this.developerDocumentsMap.get(developerEntryId);
            }

            records.push(record);
        }

        await Bun.write(
            path.join(paths.data, "extracted_developer_entries.json"),
            JSON.stringify(records)
        );
    }

    public async extractAppVersions() {
        const sql = await Bun.file(
            path.join(paths.sql, "extract_app_versions.sql")
        ).text();

        const [rows] = await this.connection.execute(sql);

        for (const {
            appEntryId,
            buildnumber,
            ee,
            appPackageId,
            version,
            hidden,
            status,
            appVersionId,
            versionName,
            releaseDate,
            changelog,
            compatibilityPlus,
            createDate,
            userName,
            downloadCount,
            description,
            documentationWebsite,
            assetAttachmentId,
            fileName,
        } of rows as any[]) {
            const edition = ee ? "EE" : "CE";

            if (this.appEditionMap.get(appEntryId)) {
                this.oldEntry = this.appEditionMap.get(appEntryId);
                this.oldEntry.push(edition);
            } else {
                this.appEditionMap.set(appEntryId, { edition });
            }

            let liferayVersion = versionName;

            if (compatibilityPlus == 1) {
                liferayVersion += "+";
            }

            const majorbuildnumber = String(buildnumber).substring(0, 2);

            const simplifiedVersion =
                majorbuildnumber.charAt(0) + "." + majorbuildnumber.charAt(1);

            if (this.appVersionMap.get(appEntryId)) {
                this.oldEntry = this.appVersionMap.get(appEntryId);
                this.oldEntry.push(simplifiedVersion);
            } else {
                this.appVersionMap.set(appEntryId, { simplifiedVersion });
            }

            const packageEntry = {
                appPackageId: appPackageId,
                liferayVersion: liferayVersion,
                buildNumber: buildnumber,
                assetAttachmentId: assetAttachmentId,
                fileName: fileName,
            };

            const versionEntry = {
                releaseDate: releaseDate,
                changeLog: changelog,
                version: version,
                packages: [packageEntry],
                status: status,
                appVersionId: appVersionId,
                createDate: createDate,
                userName: userName,
                downloadCount: downloadCount,
                description: description,
                documentationWebSite: documentationWebsite,
            };

            if (hidden == 0) {
                if (this.appVersionEntryMap.get(appEntryId)) {
                    this.oldEntry = this.appVersionEntryMap.get(appEntryId);

                    if (this.oldEntry.includes(appVersionId)) {
                        // this.oldEntry.
                    }

                    this.oldEntry.push(simplifiedVersion);
                } else {
                    this.appVersionEntryMap.set(appEntryId, {
                        appVersionId: versionEntry,
                    });
                }
            }
        }
    }

    public async extractApps() {
        const sql = await Bun.file(
            path.join(paths.sql, "extract_apps.sql")
        ).text();

        const [rows] = await this.connection.execute(sql);
        const records = [];

        for (const {
            appEntryId,
            title,
            description,
            version,
            iconURL,
            developerName,
            releaseDate,
            developerEntryId,
            licenseType,
            changelog,
            supportWebsite,
            referenceWebsite,
            documentationWebsite,
            sourceCodeWebsite,
            website,
            status,
            createDate,
            statusVersionDate,
            downloadCount,
            latestAppVersionId,
        } of rows as any[]) {
            const record = {
                appEntryId: appEntryId,
                title: title,
                description: description,
                version: version,
                iconURL: iconURL,
                developerName: developerName,
                category: this.categoriesMap.get(appEntryId),
                images: this.imagesMap.get(appEntryId),
                developerEntryId: developerEntryId,
                changeLog: changelog,
                supportWebsite: supportWebsite,
                referenceWebsite: referenceWebsite,
                documentationWebsite: documentationWebsite,
                sourceCodeWebsite: sourceCodeWebsite,
                website: website,
                price: licenseType == -1 ? "Free" : "Paid",
                prices: this.priceMap.get(appEntryId),
                terms: this.appTermsMap.get(appEntryId),
                versionEntries: this.appVersionEntryMap.get(appEntryId),
                releaseDate: releaseDate,
                productStatus: status,
                importCreateDate: createDate,
                importModifiedDate: statusVersionDate,
                downloadCount: downloadCount,
                latestAppVersionId: latestAppVersionId,
                licenseType: licenseType,
            };

            records.push(record);
        }

        console.log(records.length);

        await Bun.write(
            path.join(paths.data, "extracted_apps.json"),
            JSON.stringify(records)
        );
    }

    async run() {
        await this.setDBConnection();

        console.log("Init Processing ", new Date());

        await this.extractAppPrices();
        await this.extractAppCategories();
        await this.extractAppTerms();
        await this.extractAppImages();
        await this.extractDeveloperDocuments();
        await this.extractDeveloperImages();
        await this.extractApps();
        await this.extractDeveloperEntries();

        console.log("categoriesMap", this.categoriesMap.size);
        console.log("developerDocumentsMap", this.developerDocumentsMap.size);
        console.log("imagesMap", this.imagesMap.size);
        console.log("appTermsMap", this.appTermsMap.size);
        console.log("priceMap", this.priceMap.size);
        console.log("developerImagesMap", this.developerImagesMap.size);
        console.log("oldEntry", this.oldEntry);

        console.log("Finish Processing ", new Date());

        this.connection.end();
    }
}

const extract = new Extract();

extract.run();
