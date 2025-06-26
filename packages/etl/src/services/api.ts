import {
    APIResponse,
    OrderPage,
    Product,
    ProductOption,
    ProductSpecification,
} from "../types";
import config from "../config";
import liferay from "./liferay";
import SearchBuilder from "../core/SearchBuilder";

const IMAGE_STATUS = {
    APPROVED: 0,
    EXPIRED: 3,
};

export default {
    getPriceList(urlSearchParams = new URLSearchParams()) {
        return liferay
            .get(
                `o/headless-commerce-admin-pricing/v2.0/price-lists?${urlSearchParams}`
            )
            .json();
    },

    createPriceList(data: any) {
        return liferay
            .post(`o/headless-commerce-admin-pricing/v2.0/price-lists`, {
                json: data,
            })
            .json();
    },

    getPriceEntries(priceLIstId: number | string) {
        return liferay
            .get(
                `o/headless-commerce-admin-pricing/v2.0/price-lists/${priceLIstId}/price-entries?nestedFields=sku`
            )
            .json();
    },

    createProductSKU(productId: number, data: any) {
        return liferay
            .post(
                `o/headless-commerce-admin-catalog/v1.0/products/${productId}/skus`,
                { json: data }
            )
            .json();
    },

    getOptions() {
        return liferay.get(`o/headless-commerce-admin-catalog/v1.0/options`);
    },

    getDeliveryProductById(channelId: string, productId: string) {
        return liferay.get(
            `o/headless-commerce-delivery-catalog/v1.0/channels/${channelId}/products/${productId}?nestedFields=attachments,linkedProducts,productOptions,productSpecifications,id,images,name,categories&attachments.accountId=-1`,
            { timeout: 30000 }
        );
    },

    getProductOptionsByProductId(productId: number | string) {
        return liferay
            .get(
                `o/headless-commerce-admin-catalog/v1.0/products/${productId}/productOptions`
            )
            .json<APIResponse<ProductOption>>();
    },

    getProductOptionsByOptionId(optionId: number | string) {
        return liferay
            .get(
                `o/headless-commerce-admin-catalog/v1.0/productOptions/${optionId}/productOptionValues`
            )
            .json<APIResponse<any>>();
    },

    getOptionValues(optionId: number) {
        return liferay
            .get(
                `o/headless-commerce-admin-catalog/v1.0/options/${optionId}/optionValues`
            )
            .json<APIResponse<any>>();
    },

    createProductOptionValue(productOptionId: number | string, data: unknown) {
        return liferay.post(
            `/o/headless-commerce-admin-catalog/v1.0/productOptions/${productOptionId}/productOptionValues`,
            { json: data }
        );
    },

    async getOrders(urlSearchParams = new URLSearchParams()) {
        const response = await liferay.get(
            `o/headless-commerce-admin-order/v1.0/orders?${urlSearchParams.toString()}`,
            { timeout: 30000 }
        );

        return response.json<OrderPage>();
    },

    postProductOptions(productId: number | string, data: unknown) {
        return liferay.post(
            `o/headless-commerce-admin-catalog/v1.0/products/${productId}/productOptions`,
            { json: data }
        );
    },

    deleteAccount(accountId: number) {
        return liferay.delete(
            `o/headless-admin-user/v1.0/accounts/${accountId}`
        );
    },

    updateAccount(accountId: number, data: unknown) {
        return liferay.patch(
            `o/headless-admin-user/v1.0/accounts/${accountId}`,
            {
                json: data,
            }
        );
    },

    getAccounts(searchParams: URLSearchParams = new URLSearchParams()) {
        return liferay.get(
            `o/headless-admin-user/v1.0/accounts?${searchParams.toString()}`,
            { timeout: 30000 }
        );
    },

    async getAccountById(accountId: number, searchParams: URLSearchParams = new URLSearchParams()) {
        const response = await liferay.get(
            `o/headless-admin-user/v1.0/accounts/${accountId}?${searchParams.toString()}`,
            { timeout: 30000 }
        );

        return response.json<OrderPage>();
    },

    getProductByERC(productId: number) {
        return liferay
            .get(
                `o/headless-commerce-admin-catalog/v1.0/products/by-externalReferenceCode/${productId}?nestedFields=id,name,catalog,categories,productSpecifications,productVirtualSettings,skus,images`
            )
            .json();
    },

    async getProductById(productId: number) {
        const response = await liferay.get(
            `o/headless-commerce-admin-catalog/v1.0/products/${productId}?nestedFields=id,name,catalog,categories,productSpecifications,productVirtualSettings,skus`,
            { timeout: 30000 }
        );

        return response.json<Product>();
    },

    async getProducts(page: number, pageSize: number) {
        const response = await liferay.get(
            `o/headless-commerce-admin-catalog/v1.0/products?nestedFields=id,name,catalog,categories,productSpecifications,productVirtualSettings,skus&page=${page}&pageSize=${pageSize}`,
            { timeout: 30000 }
        );

        return response.json<APIResponse<Product>>();
    },

    async getDeliveryProducts(
        channelId: string,
        page: number,
        pageSize: number
    ) {
        const response = await liferay.get(
            `o/headless-commerce-delivery-catalog/v1.0/channels/${channelId}/products?nestedFields=attachments,linkedProducts,productOptions,skus,productSpecifications,id,images,name,categories&attachments.accountId=-1&page=${page}&pageSize=${pageSize}`,
            { timeout: 30000 }
        );

        return response.json<APIResponse<Product>>();
    },

    getProductAttachments(channelId: string, productId: number | string) {
        return liferay.get(
            `o/headless-commerce-delivery-catalog/v1.0/channels/${channelId}/products/${productId}/attachments?accountId=-1`
        );
    },

    getProductImages(channelId: string, productId: number | string) {
        return liferay.get(
            `o/headless-commerce-delivery-catalog/v1.0/channels/${channelId}/products/${productId}/images`
        );
    },

    updateProduct(productId: number, data: unknown) {
        return liferay
            .patch(
                `o/headless-commerce-admin-catalog/v1.0/products/${productId}`,
                {
                    json: data,
                }
            )
            .json<APIResponse<any>>();
    },

    async createProductSpecification(
        productId: number | string,
        data: unknown
    ) {
        const response = await liferay.post(
            `o/headless-commerce-admin-catalog/v1.0/products/${productId}/productSpecifications`,
            { json: data }
        );

        return response.json<ProductSpecification>();
    },

    createProductVirtualEntry(virtualSettingId: number, data: any) {
        return liferay.post(
            `o/headless-commerce-admin-catalog/v1.0/product-virtual-settings/${virtualSettingId}/product-virtual-settings-file-entries`,
            { body: data, timeout: 600000 } // 10 minutes
        );
    },

    getSpecification(urlSearchParams = new URLSearchParams()) {
        return liferay.get(
            `o/headless-commerce-admin-catalog/v1.0/specifications?${urlSearchParams.toString()}`
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

    postProduct(body: unknown) {
        return liferay
            .post(`o/headless-commerce-admin-catalog/v1.0/products`, {
                json: body,
            })
            .json<Product>();
    },

    postProductImage(productId: number, body: unknown) {
        return liferay.post(
            `o/headless-commerce-admin-catalog/v1.0/products/${productId}/images`,
            { json: body }
        );
    },

    createImage(body: any, externalReferenceCode: string) {
        return liferay.post(
            `o/headless-commerce-admin-catalog/v1.0/products/by-externalReferenceCode/${externalReferenceCode}/images`,
            {
                body: JSON.stringify(body),
                headers: { "Content-Type": "application/json" },
            }
        );
    },

    createAttachment(body: any, externalReferenceCode: string) {
        return liferay.post(
            `o/headless-commerce-admin-catalog/v1.0/products/by-externalReferenceCode/${externalReferenceCode}/attachments`,
            {
                body: JSON.stringify(body),
                headers: { "Content-Type": "application/json" },
            }
        );
    },

    postSpecification(productId: number, body: unknown) {
        return liferay.post(
            `o/headless-commerce-admin-catalog/v1.0/products/${productId}/productSpecifications`,
            { json: body }
        );
    },

    myUserAccount() {
        return liferay.get("o/headless-admin-user/v1.0/my-user-account");
    },

    getCatalogs(searchParams: URLSearchParams = new URLSearchParams()) {
        return liferay.get(
            `o/headless-commerce-admin-catalog/v1.0/catalogs?${searchParams.toString()}`
        );
    },

    getCompanyByWebId() {
        return liferay.get(
            "api/jsonws/company/get-company-by-web-id?webId=liferay.com"
        );
    },

    async getPostalAddresses(accountId: number | string) {
        const response = liferay.get(
            `o/headless-admin-user/v1.0/accounts/${accountId}/postal-addresses`
        );

        const addressList=  await response.json() as any
        
        return addressList.items as Array<{
            streetAddressLine1?: string;
            addressLocality?: string;
            addressRegion?: string;
            postalCode?: string;
            addressCountry?: string;
        }>;

    },

    getTaxonomyVocabularies(siteId: number | string) {
        return liferay.get(
            `o/headless-admin-taxonomy/v1.0/sites/${siteId}/taxonomy-vocabularies`
        );
    },

    updateProductCategories(productId: number, body: any) {
        return liferay.patch(
            `o/headless-commerce-admin-catalog/v1.0/products/${productId}/categories`,
            { json: body }
        );
    },

    async getCategories(vocabularyId: number) {
        const response = await liferay.get(
            `o/headless-admin-taxonomy/v1.0/taxonomy-vocabularies/${vocabularyId}/taxonomy-categories`
        );

        return response.json<APIResponse<any>>();
    },

    createCategory(vocabularyId: number, body: unknown) {
        return liferay
            .post(
                `o/headless-admin-taxonomy/v1.0/taxonomy-vocabularies/${vocabularyId}/taxonomy-categories`,
                { json: body }
            )
            .json<any>();
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

    async createDocumentFolder(name: string, parentDocumentFolderId: number) {
        const url =
            parentDocumentFolderId !== 0
                ? `o/headless-delivery/v1.0/document-folders/${parentDocumentFolderId}/document-folders`
                : `o/headless-delivery/v1.0/sites/${config.SITE_ID}/document-folders`;

        const response = await liferay.post(url, {
            json: {
                name,
                parentDocumentFolderId,
                viewableBy: "Anyone",
            },
            timeout: 30000,
        });

        return response.json<{ id: number }>();
    },

    createCatalog(catalog: any) {
        return liferay.post(`o/headless-commerce-admin-catalog/v1.0/catalogs`, {
            json: catalog,
        });
    },

    createAccount(account: unknown) {
        return liferay.post("o/headless-admin-user/v1.0/accounts", {
            json: account,
        });
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

    createPublisherAsset(data: unknown) {
        return liferay
            .post("o/c/publisherassetses", {
                json: data,
                timeout: 500000,
            })
            .json<any>();
    },

    getDocumentFolders(
        siteId: number | string,
        searchParams: URLSearchParams = new URLSearchParams()
    ) {
        return liferay.get(
            `o/headless-delivery/v1.0/sites/${siteId}/document-folders?${searchParams.toString()}`,
            { timeout: 30000 }
        );
    },

    createDocumentFolderDocument(documentFolderId: string, document: any) {
        return liferay
            .post(
                `o/headless-delivery/v1.0/document-folders/${documentFolderId}/documents`,
                {
                    body: document,
                }
            )
            .json<any>();
    },

    getDocumentFolderDocuments(folderId: number) {
        return liferay
            .get(
                `o/headless-delivery/v1.0/document-folders/${folderId}/documents`,
                {
                    timeout: 30000,
                }
            )
            .json<APIResponse>();
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

    getDocumentFolderDocumentSubFolders(
        folderId: number,
        searchParams: URLSearchParams = new URLSearchParams()
    ) {
        return liferay
            .get(
                `o/headless-delivery/v1.0/document-folders/${folderId}/document-folders?${searchParams.toString()}`
            )
            .json<any>();
    },
};
