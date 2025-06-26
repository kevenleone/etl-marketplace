import liferay from "../../../services/liferay";
import { path, paths } from "../../../utils/paths";

class Catalog {
    async get() {
        return liferay
            .get(
                "o/headless-commerce-admin-catalog/v1.0/catalogs?pageSize=2000"
            )
            .json<{ items: any[] }>();
    }

    async write() {
        const catalogResponse = await this.get();
        const catalogs: {
            [key: string]: string;
        } = {};

        for (const catalog of catalogResponse?.items) {
            catalogs[catalog.externalReferenceCode] = catalog.id;
        }

        Bun.write(
            path.join(paths.metadata, "catalogs.json"),
            JSON.stringify(catalogs)
        );

        console.log(catalogs);
    }
}

const catalog = new Catalog();

catalog.write();
