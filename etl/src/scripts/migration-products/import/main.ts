import config from "../../../config";
import api from "../../../services/api";
import { path, paths } from "../../../utils/paths";
import { sanitize } from "../../../utils/sanitize";

const companyId = 20119;

type DocumentFolderInput = {
    filename: string;
    id: string;
    path: string;
};

class MainImport {
    async processCatalogRole(catalog: any, rolesByName: any) {
        const roleName = `${catalog.name} App Editor`
            .replace("*", "")
            .replace(",", "")
            .replace(".", "")
            .replace("/", "");

        if (rolesByName.some(({ name }: any) => name === roleName)) {
            return;
        }

        console.log("Creating Catalog Role", roleName);

        const addRoleResponse = await api.addRoleJSONWS(roleName);

        if (!addRoleResponse?.result?.classPK) {
            return console.log({ addRoleResponse });
        }

        try {
            await api.addResourcePermissionJSONWS(
                addRoleResponse.result.classPK,
                catalog.id,
                companyId
            );

            console.log("Creating Catalog Permission");
        } catch (error) {
            console.error(error);
        }
    }

    async processCatalog({ catalog, roles }: any) {
        const catalogResponse = await api.createCatalog(catalog);

        console.log(
            `Catalog Created ${catalog.name} ${catalog.externalReferenceCode} `
        );

        await this.processCatalogRole(catalogResponse, roles);

        return catalogResponse;
    }

    async addMissingDocumentFolders(
        documentPath: string,
        documentFoldersByPath: any
    ) {
        if (documentFoldersByPath[documentPath]) {
            return;
        }

        let parentDocumentFolderId = 0;

        const documentPathComponents = documentPath.split("/");
        let documentPathPrefix = "";

        for (const documentPathComponent of documentPathComponents) {
            const _documentPath = documentPathPrefix + documentPathComponent;
            documentPathPrefix = _documentPath + "/";

            console.log(`Checking Document Path: ${_documentPath}`);

            if (documentFoldersByPath[_documentPath]) {
                parentDocumentFolderId =
                    documentFoldersByPath[_documentPath].id;

                continue;
            }

            const newDocumentFolder = await api.createDocumentFolder(
                documentPathComponent,
                parentDocumentFolderId
            );

            console.log("Document Folder created");

            documentFoldersByPath[_documentPath] = {
                id: newDocumentFolder.id,
                parentDocumentFolderId,
            };

            parentDocumentFolderId = newDocumentFolder.id;
        }

        console.log(`Adding Folders to ${documentPath}`);
    }

    async updateDocument(input: DocumentFolderInput) {
        const file = Bun.file(input.filename);

        if (await file.exists()) {
            return console.error(`${JSON.stringify(input)} doesnt not exists`);
        }

        const formData = new FormData();

        formData.append("document", JSON.stringify({ title: input.filename }));
        formData.append("file", file);

        return api.updateSiteDocuments(input.id, formData);
    }

    async createDocumentFolderDocument(input: DocumentFolderInput) {}

    async uploadDeveloperDocuments(
        developerEntry: any,
        documentFolders: any,
        siteDocuments: any
    ) {
        const documents = developerEntry.documents;

        if (!documents || !documents.length) {
            return;
        }

        const folder = path.join(
            paths.developer,
            developerEntry.developerEntryId
        );

        const name =
            developerEntry.legalEntityName ||
            `${developerEntry.firstName} ${developerEntry.lastName}`;

        const developerFolder = `Publishers/${sanitize(name)}`;
        const developerTaxDocumentsFolder = `${developerFolder}/Tax Documents`;

        await this.addMissingDocumentFolders(
            developerTaxDocumentsFolder,
            documentFolders
        );

        const taxDocumentFolderId = documentFolders[developerFolder].id;

        if (!taxDocumentFolderId) {
            return console.warn("WATCH MEEE");
        }

        const developerDirectory = `${paths.developer}/${developerEntry.developerEntryId}`;

        for (const document of documents) {
            const { assetAttachmentId, filename } = document;
            const fileName = `${assetAttachmentId}-${filename}`;
            const path = `${developerDirectory}/${assetAttachmentId}`;

            const fullDoclibPath = `${developerTaxDocumentsFolder}/${fileName}`;

            const fn = siteDocuments[fullDoclibPath]
                ? this.updateDocument
                : this.createDocumentFolderDocument;

            await fn({
                path,
                filename,
                id: siteDocuments[fullDoclibPath]?.id || taxDocumentFolderId,
            });
        }
    }

    async processCatalogs({
        roles,
        siteDocumentsByPath,
        documentsFolderByPath,
    }: {
        roles: any[];
        siteDocumentsByPath: string;
        documentsFolderByPath: string;
    }) {
        const developerEntries: any = {};

        const [extractedApps, extractedDeveloperEntries] = await Promise.all([
            Bun.file(path.join(paths.data, "extracted_apps.json")).json(),
            Bun.file(
                path.join(paths.data, "extracted_developer_entries.json")
            ).json(),
        ]);

        const savedCatalogs = [];

        for (const extractedDeveloperEntry of extractedDeveloperEntries) {
            developerEntries[extractedDeveloperEntry.developerEntryId] =
                extractedDeveloperEntry;
        }

        for (const extractedApp of extractedApps) {
            const catalog = {
                externalReferenceCode: extractedApp.developerEntryId,
                name: extractedApp.developerName,
                currencyCode: "USD",
                defaultLanguageId: "en_US",
            };
            const result = await this.processCatalog({ catalog, roles });

            const developerEntry =
                developerEntries[catalog.externalReferenceCode];

            await this.uploadDeveloperDocuments(
                developerEntry,
                documentsFolderByPath,
                documentsFolderByPath
            );

            savedCatalogs.push(result);
        }
    }

    getPath(documentFolders: any[], documentFolder: any, path: string): string {
        const nextPath = path
            ? `${documentFolder.name}/${path}`
            : documentFolder.name;

        if (documentFolder.parentDocumentFolderId) {
            return this.getPath(
                documentFolders,
                documentFolders.find(
                    (_documentFolder) =>
                        _documentFolder.id ===
                        documentFolder.parentDocumentFolderId
                ),
                nextPath
            );
        }

        return nextPath;
    }

    async run() {
        const myUserAccount = await api.myUserAccount();

        const [
            documentFolderResponse,
            documentResponse,
            accountGroupResponse,
            rolesResponse,
        ] = await Promise.all([
            api.getSiteDocumentFolders(),
            api.getSiteDocuments(),
            api.getAccountGroups(),
            api.getRoles(),
        ]);

        const { items: accountGroups } = accountGroupResponse;
        const { items: documentFolders } = documentFolderResponse;
        const { items: documents } = documentResponse;

        const documentsFolderByPath: any = {};

        for (const documentFolder of documentFolders) {
            documentsFolderByPath[
                this.getPath(documentFolders, documentFolder, "")
            ] = documentFolder;
        }

        const siteDocumentsByPath: any = {};
        const siteDocumentsByTitle: any = {};

        for (const document of documents) {
            const { documentFolderId, title } = document;
            const pathKey =
                (documentFolderId === 0 ? title : [][documentFolderId]) +
                `/${title}`;

            siteDocumentsByPath[pathKey] = {
                documentFolderId,
                id: document.id,
                contentUrl: document.contentUrl,
            };

            siteDocumentsByTitle[title] = document;
        }

        let businessPublisherAccountGroup = accountGroups.find(
            (accountGroup: any) => accountGroup.name === "Business Publisher"
        );

        if (!businessPublisherAccountGroup) {
            businessPublisherAccountGroup = await api.createAccountGroup({
                externalReferenceCode: "business-publisher",
                name: "Business Publisher",
            });

            console.log(`Account Group - ${businessPublisherAccountGroup}`);
        }

        await this.processCatalogs({
            roles: rolesResponse.items ?? [],
            siteDocumentsByPath,
            documentsFolderByPath,
        });
    }
}

const main = new MainImport();

main.run();
