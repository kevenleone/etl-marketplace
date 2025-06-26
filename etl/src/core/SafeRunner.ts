import prompts from "prompts";

import { ENV } from "../config/env";

if (ENV.LIFERAY_HOST?.startsWith("https")) {
    const { value } = await prompts({
        type: "confirm",
        name: "value",
        message: `[CAUTION] you are running into an external environment - ${ENV.LIFERAY_HOST}`,
        initial: false,
    });

    if (!value) {
        console.log("See you soon!");
        process.exit(0);
    }
}
