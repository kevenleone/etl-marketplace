import ky from "ky";
import { koroneikiAuthSchema } from "../schemas/zod";
import { ENV } from "../config/env";

const { KORONEIKI_AUTHORIZATION, KORONEIKI_URL } = koroneikiAuthSchema.parse(ENV);

const koroneiki = ky.extend({
    prefixUrl: KORONEIKI_URL,
    headers: {
        "API_TOKEN": KORONEIKI_AUTHORIZATION
    }
})

const koroneikiClient = {
    fetch: koroneiki
}

export default koroneikiClient