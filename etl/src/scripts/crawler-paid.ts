import ky from "ky";
import * as cheerio from "cheerio";
import path from "path";

type Product = {
    index: number;
    href: string;
    title: string;
    licenseOptions: any[];
};

let allProducts: Product[] = [];

async function run(page = 1, productIndex = 0) {
    const response = await ky.get(
        `............/home?price-model=Paid&delta=60&start=${page}`,
        { timeout: 30000 }
    );

    const text = await response.text();

    const $ = cheerio.load(text);

    const products: Product[] = [];

    $(".app-search-results-card").each((index, element) => {
        const baseElement = $(element);

        const href = baseElement.attr("href") as string;
        const title = baseElement.find(".title-container").text().trim();

        console.log(title);

        products.push({ index, href, title, licenseOptions: [] });
    });

    allProducts.push(...products);

    if (page !== 3) {
        return run(page + 1, productIndex);
    }

    let result = "";

    for (const product of allProducts) {
        result += `${product.title}\n`;
    }

    Bun.write(path.join(import.meta.dir, "file.csv"), result);
}

run();
