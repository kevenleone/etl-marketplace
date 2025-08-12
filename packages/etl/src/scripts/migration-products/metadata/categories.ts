import liferay from "../../../services/liferay";
import { path, paths } from "../../../utils/paths";

class Categories {
    async getSite(url: string) {
        return liferay
            .get(`o/headless-admin-user/v1.0/sites/by-friendly-url-path/${url}`)
            .json<{ id: string }>();
    }

    async getTaxonomyVocabularies(siteId: string) {
        const response = await liferay.get(
            `o/headless-admin-taxonomy/v1.0/sites/${siteId}/taxonomy-vocabularies?pageSize=-1&fields=id,name`
        );

        return response.json<any>();
    }

    async getTaxonomyCategoriesByVocabulary(vocabularyId: string) {
        console.log({ vocabularyId });

        return liferay
            .get(
                `o/headless-admin-taxonomy/v1.0/taxonomy-vocabularies/${vocabularyId}/taxonomy-categories`
            )
            .json();
    }

    async run() {
        const site = await this.getSite("global");
        const response = await this.getTaxonomyVocabularies(site.id);

        const taxonomyVocabularies = response.items.filter((item: any) =>
            [
                "Marketplace Edition",
                "Marketplace Liferay Version",
                "Marketplace Product Type",
                "Marketplace App Category",
                "Marketplace Liferay Platform Offering",
            ].includes(item.name)
        );

        for (const taxonomyVocabulary of taxonomyVocabularies) {
            const vocabularyResponse =
                await this.getTaxonomyCategoriesByVocabulary(
                    taxonomyVocabulary.id
                );

            await Bun.write(
                path.join(
                    paths.metadata,
                    taxonomyVocabulary.name.replaceAll(" ", "_").toLowerCase() +
                        ".json"
                ),
                JSON.stringify(vocabularyResponse)
            );

            console.log("Saved", taxonomyVocabulary.name);
        }
    }
}

const categories = new Categories();

categories.run();
