import {
    getProductByExternalReferenceCode,
    patchProductVirtualSettingsFileEntry,
    ProductVirtualSettingsFileEntry,
    getProductVirtualSettingIdProductVirtualSettingsFileEntriesPage,
    postProductVirtualSettingIdProductVirtualSettingsFileEntry,
} from 'liferay-headless-rest-client/headless-commerce-admin-catalog-v1.0';

import { liferayClient } from '../services/liferay';
import { paths } from '../utils/paths';
import { getFileName } from '../utils/filename';

/**
 * @description
 * This script is a helper on how to Retrieve a Commerce Product and to List and Download File Entries
 * Including how to Update and Create a File Entry
 * For more references search here http://localhost:8080/o/api?endpoint=https://localhost:8080/o/headless-commerce-admin-catalog/v1.0/openapi.json
 * And browse the following APIs for detailed documentation:

 * getProductByExternalReferenceCode
 * getProductVirtualSettingIdProductVirtualSettingsFileEntriesPage
 * postProductVirtualSettingIdProductVirtualSettingsFileEntry
 * patchProductVirtualSettingsFileEntry
 */

async function downloadFileEntriesFromProduct(externalReferenceCode: string) {
    // Equivalent to

    // /o/headless-commerce-admin-catalog/v1.0/products/by-externalReferenceCode/${externalReferenceCode}?nestedFields=productVirtualSettings

    const response = await getProductByExternalReferenceCode({
        client: liferayClient,
        query: {
            nestedFields: 'productVirtualSettings',
        } as any,
        path: {
            externalReferenceCode,
        },
    });

    if (response.error) {
        return console.error(response.error);
    }

    const product = response.data!;

    const productVirtualSettings = product.productVirtualSettings;

    // The Product may contain Virtual Settings (For Virtual Products) with multiples
    // Virtual Settings File Entries that contains the file and the version (plain text)
    // This version on Marketplace represents the DXP Version that can be: 2025 Q1, 2025 Q2,.

    if (!productVirtualSettings) {
        return console.info('Product has no virtual settings');
    }

    const friendlyURL = product.urls!.en_US;

    const virtualFileEntriesPage =
        // Equivalent to
        // o/headless-commerce-admin-catalog/v1.0/product-virtual-settings/${virtualSettingId}/product-virtual-settings-file-entries

        await getProductVirtualSettingIdProductVirtualSettingsFileEntriesPage({
            client: liferayClient,
            path: { id: String(productVirtualSettings.id) },
        });

    const productVirtualSettingsFileEntries =
        virtualFileEntriesPage.data!.items ?? [];

    for (const productVirtualSettingsFileEntry of productVirtualSettingsFileEntries) {
        const downloadURL = productVirtualSettingsFileEntry.src as string;

        const { data, response } = await liferayClient.get({
            url: downloadURL,
        });

        const version = productVirtualSettingsFileEntry.version;

        const blob = data as Blob;

        await Bun.write(
            `${paths.files}/${friendlyURL}/${productVirtualSettingsFileEntry.version}/${getFileName(response)}`,
            blob,
        );

        await updateFileEntryVersion(productVirtualSettingsFileEntry.id ?? 0, {
            version: version + ', 2025 Q1',
        });
    }
}

async function createFileEntry(
    productVirtualSettingsId: number,
    payload: ProductVirtualSettingsFileEntry,
) {
    const formData = new FormData();

    formData.append(
        'file',
        new Blob([
            // fake input here...
        ]),
    );

    formData.append(
        'productVirtualSettingsFileEntry',
        JSON.stringify({
            version: payload.version,
        }),
    );

    // Equivalent to
    // o/headless-commerce-admin-catalog/v1.0/product-virtual-settings/{productVirtualSettingsId}/product-virtual-settings-file-entries

    await postProductVirtualSettingIdProductVirtualSettingsFileEntry({
        body: formData as any,
        client: liferayClient,
        path: { id: String(productVirtualSettingsId) },
    });
}

async function updateFileEntryVersion(
    fileEntryId: number,
    payload: ProductVirtualSettingsFileEntry,
) {
    // Equivalent to

    // o/headless-commerce-admin-catalog/v1.0/product-virtual-settings-file-entries/${fileEntryId}

    await patchProductVirtualSettingsFileEntry({
        client: liferayClient,
        path: { id: String(fileEntryId) },
        body: { productVirtualSettingsFileEntry: payload },
    });
}

downloadFileEntriesFromProduct('dracula-theme');
