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

async function processPage(product: Product) {
    const response = await ky.get(product.href);

    const text = await response.text();

    const $ = cheerio.load(text);

    $("#mpLicense.marketplace-tabs-info .description-content li").each(
        (index, element) => {
            const li = $(element).text().trim();
            const [count, dxpOption, , type, price, currency] = li.split(" ");

            product.licenseOptions.push({
                original: li,
                count,
                dxpOption,
                type,
                price,
                currency,
            });
        }
    );
}

async function run(page = 1, productIndex = 0) {
    const response = await ky.get(
        `......./home?price=449511433&delta=60&start=${page}`
    );

    const text = await response.text();

    const $ = cheerio.load(text);

    const products: Product[] = [];

    $(".app-search-results-card").each((index, element) => {
        const baseElement = $(element);

        const href = baseElement.attr("href") as string;
        const title = baseElement.find(".title").text().trim();

        products.push({ index, href, title, licenseOptions: [] });
    });

    for (const product of products) {
        await processPage(product);

        console.log(product.title, product.href, product.licenseOptions);
    }

    allProducts.push(...products);

    if (page !== 3) {
        return run(page + 1, productIndex);
    }

    let result = "";

    for (const product of allProducts) {
        result += `${product.title}, ${product.href}, ${
            product.licenseOptions.length ? "true" : "false"
        }, ${product.licenseOptions
            .map(({ original }) => original.replaceAll(",", "-"))
            .join(", ")} \n`;
    }

    Bun.write(path.join(import.meta.dir, "file.csv"), result);
}

run();
