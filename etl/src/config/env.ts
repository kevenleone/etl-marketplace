import { z } from "zod";

export const ENV = import.meta.env;

export const schema = z
    .object({
        OAUTH_CLIENT_ID: z.string().optional(),
        OAUTH_CLIENT_SECRET: z.string().optional(),
        OAUTH_HOST: z.string().optional(),
    })
    .parse(ENV);
