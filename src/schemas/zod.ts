import { z } from "zod";

export const migrateProductVersionSchema = z.object({
    DATABASE_URL: z
        .string()
        .describe("Prisma Database connection to Liferay Portal 6.1"),
    OAUTH_HOST: z
        .string()
        .describe("Liferay Portal OAuth2 configuration OAUTH_HOST"),
    OAUTH_CLIENT_ID: z
        .string()
        .describe("Liferay Portal OAuth2 configuration OAUTH_CLIENT_ID"),
    OAUTH_CLIENT_SECRET: z
        .string()
        .describe("Liferay Portal OAuth2 configuration OAUTH_CLIENT_SECRET"),
});

export const downloadSchema = z.object({
    domain: z
        .string()
        .describe("The domain where you want to download the files"),
    username: z
        .string()
        .describe(
            "Your liferay username (the same from your email address without the domain)"
        ),
    jsessionid: z
        .string()
        .describe("Get the JSESSIONID cookie from the download site page"),
});