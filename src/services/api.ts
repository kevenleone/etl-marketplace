import config from "../config";
import liferay from "./liferay";

const IMAGE_STATUS = {
    APPROVED: 0,
    EXPIRED: 3,
};

export default {
    getProducts(page: number, pageSize: number) {
        return liferay.get(
            `o/headless-commerce-admin-catalog/v1.0/products?nestedFields=id,name,categories,productSpecifications,skus&page=${page}&pageSize=${pageSize}`,
            { timeout: 30000 }
        );
    },

    getExpiredAttachments(classNameId: number, classPK: number) {
        return liferay.post(`api/jsonws/invoke`, {
            json: {
                "/commerce.cpattachmentfileentry/get-cp-attachment-file-entries":
                    {
                        classNameId,
                        classPK,
                        type: 0,
                        status: IMAGE_STATUS.APPROVED,
                        start: 0,
                        end: 20,
                    },
            },
        });
    },

    getFetchClassName() {
        return liferay.post(`api/jsonws/invoke`, {
            json: {
                "/classname/fetch-class-name": {
                    value: "com.liferay.commerce.product.model.CPDefinition",
                },
            },
        });
    },
    postProductImage(productId: number, body: unknown) {
        return liferay.post(
            `o/headless-commerce-admin-catalog/v1.0/products/${productId}/images`,
            { json: body }
        );
    },

    myUserAccount() {
        return liferay.get("o/headless-admin-user/v1.0/my-user-account");
    },

    getCompanyByWebId() {
        return liferay.get(
            "api/jsonws/company/get-company-by-web-id?webId=liferay.com"
        );
    },

    addRoleJSONWS(roleName: string) {
        return liferay
            .post("api/jsonws/role", {
                body: JSON.stringify({
                    method: "add-role",
                    params: {
                        className: "com.liferay.portal.kernel.model.Role",
                        classPK: 0,
                        descriptionMap: JSON.stringify({
                            "en-US":
                                "This role can be assigned to an account user to give them " +
                                "permission to add/submit an app to the Marketplace on " +
                                "behalf of this account.",
                        }),
                        name: roleName,
                        subtype: "",
                        titleMap: JSON.stringify({ "en-US": roleName }),
                        type: 1,
                    },
                    id: 123,
                    jsonrpc: "2.0",
                }),
                headers: {
                    Accept: "application/json",
                    "User-Agent": "python-upload",
                    "Content-Type": "application/json",
                },
            })
            .json<any>();
    },

    addResourcePermissionJSONWS(
        roleId: number | string,
        catalogId: number,
        companyId: number
    ) {
        console.log({ roleId, catalogId, companyId });
        return liferay
            .post("api/jsonws/resourcepermission", {
                json: {
                    method: "set-individual-resource-permissions",
                    params: {
                        actionIds: ["DELETE", "PERMISSIONS", "UPDATE", "VIEW"],
                        companyId,
                        groupId: 0,
                        primKey: catalogId,
                        name: "com.liferay.commerce.product.model.CommerceCatalog",
                        roleId: roleId,
                    },
                    id: 123,
                    jsonrpc: "2.0",
                },
            })
            .json();
    },

    getAccountGroups() {
        return liferay
            .get(
                "o/headless-commerce-admin-account/v1.0/accountGroups?pageSize=1000"
            )
            .json<any>();
    },

    createDocumentFolder(name: string, parentDocumentFolderId: number) {
        const url =
            parentDocumentFolderId !== 0
                ? `/o/headless-delivery/v1.0/document-folders/{parentDocumentFolderId}/document-folders`
                : `o/headless-delivery/v1.0/sites/${config.SITE_ID}/document-folders`;

        return liferay
            .post(url, {
                json: {
                    name,
                    parentDocumentFolderId,
                    viewableBy: "Anyone",
                },
            })
            .json<{ id: number }>();
    },

    createCatalog(catalog: any) {
        return liferay
            .post(`o/headless-commerce-admin-catalog/v1.0/catalogs`, {
                json: catalog,
            })
            .json();
    },

    createAccountGroup(accountGroup: any) {
        return liferay
            .post("o/headless-commerce-admin-account/v1.0/accountGroups", {
                json: accountGroup,
            })
            .json();
    },

    getRoles() {
        return liferay
            .get("o/headless-admin-user/v1.0/roles?types=1&pageSize=-1")
            .then((response) => response.json<any>());
    },

    updateSiteDocuments(id: string, document: any) {
        return liferay
            .put(`o/headless-delivery/v1.0/documents/${id}`, {
                body: document,
            })
            .json<any>();
    },

    createSiteDocuments(document: any) {
        return liferay
            .post(
                `o/headless-delivery/v1.0/sites/${config.SITE_ID}/documents`,
                {
                    json: document,
                }
            )
            .json<any>();
    },

    createDocumentFolderDocument(documentFolderId: string, document: any) {
        return liferay
            .post(
                `o/headless-delivery/v1.0/document-folders/${documentFolderId}/documents`,
                {
                    json: document,
                }
            )
            .json<any>();
    },

    getSiteDocuments() {
        return liferay
            .get(
                `o/headless-delivery/v1.0/sites/${config.SITE_ID}/documents?fields=contentUrl,documentFolderId,documentType,id,title&flatten=true&page=-1`
            )
            .json<any>();
    },

    getSiteDocumentFolders() {
        return liferay
            .get(
                `o/headless-delivery/v1.0/sites/${config.SITE_ID}/document-folders?fields=id,parentDocumentFolderId,name&flatten=true&page=-1`
            )
            .json<any>();
    },
};
