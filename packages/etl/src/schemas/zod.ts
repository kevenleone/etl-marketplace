import { z } from 'zod';

export const createProductFromJSONchema = z.object({
    CHANNEL_ID: z
        .string()
        .min(3)
        .describe('The channelId to create the products'),
    SITE_ID: z.string().min(3).describe('The siteId to create the products'),
});

export const createProductFromCSVSchema = z.object({
    CATALOG_ID: z.string().describe('The catalog to create the products'),
});

export const downloadSchema = z.object({
    domain: z
        .string()
        .describe('The domain where you want to download the files'),
    username: z
        .string()
        .describe(
            'Your liferay username (the same from your email address without the domain)',
        ),
    jsessionid: z
        .string()
        .describe('Get the JSESSIONID cookie from the download site page'),
});

export const exportProductIdsSchema = z.object({
    CHANNEL_ID: z.string().describe('The channelId to create the products'),
    PRODUCT_IDS: z.string(),
});

export const exportProductFileSchema = z.object({
    CHANNEL_ID: z.string().describe('The channelId to create the products'),
});

export const liferayAuthSchema = z.object({
    LIFERAY_CLIENT_ID: z.string().optional(),
    LIFERAY_CLIENT_SECRET: z.string().optional(),
    LIFERAY_HOST: z.string(),
    LIFERAY_PASSWORD: z.string().optional(),
    LIFERAY_USERNAME: z.string().optional(),
});

export const migrateProductVersionSchema = liferayAuthSchema.extend({
    DATABASE_URL: z
        .string()
        .describe('Prisma Database connection to Liferay Portal 6.1'),
    SITE_ID: z.coerce.number().positive().int().min(1000, 'Site ID is missing'),
});

export const koroneikiAuthSchema = z.object({
    KORONEIKI_AUTHORIZATION: z.string().describe('Koroneiki API Key'),
    KORONEIKI_URL: z.string().describe('Koroneiki API URL'),
});