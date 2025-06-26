import "../core/SafeRunner";
import { ENV, schema } from "./env";

const config = {
    extractDatabase: {
        user: ENV.DATABASE_USER,
        password: ENV.DATABASE_PASSWORD,
        host: ENV.DATABASE_HOST,
        port: ENV.DATABASE_PORT,
        database: ENV.DATABASE_NAME,
    },
    download: {
        domain: ENV.DOWNLOAD_WEB_DOMAIN,
        username: ENV.DOWNLOAD_WEB_USERNAME,
        jsessionid: ENV.DOWNLOAD_WEB_JSESSIONID,
        marketplaceportletpage: `${ENV.DOWNLOAD_WEB_DOMAIN}/de/web/${ENV.DOWNLOAD_WEB_USERNAME}/apps`,
        marketplacecontrolpanelpage: `${ENV.DOWNLOAD_WEB_DOMAIN}/de/group/control_panel/manage`,
    },
    CLIENT_ID: schema.OAUTH_CLIENT_ID,
    CLIENT_SECRET: schema.OAUTH_CLIENT_SECRET,
    OAUTH_HOST: schema.OAUTH_HOST,
    SITE_ID: ENV.SITE_ID,
    WEBID: ENV.WEB_ID,
};

export default config;
