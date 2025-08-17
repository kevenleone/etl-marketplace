import Prisma from '../core/Prisma';
import { path, paths } from '../utils/paths';

class AppEntryDiff {
    async getCSVLines() {
        const csv = await Bun.file(path.join(paths.csv, 'products.csv'));

        return csv.split('\n').map((line) => line.split(';'));
    }

    async run() {
        const appEntries = await Prisma.oSB_AppEntry.findMany({
            where: { status: 102 },
            orderBy: { title: 'asc' },
        });
        const lines = await this.getCSVLines();

        const status = {
            0: 'Approved',
            1: 'Pending',
            2: 'Unsubmitted',
            3: 'Not Available - Approved',
            4: 'Denied',
            102: 'Approved - Subscribers Only',
        };

        let i = 0;

        const rows = [
            'Title|Developer Name|Status|Status Label|Present on MP2|Hidden\n',
        ];

        for (const appEntry of appEntries) {
            const lineFound = lines.some(
                ([, appEntryId, title]) =>
                    title === appEntry.title ||
                    appEntryId === appEntry.appEntryId.toString(),
            );

            rows.push(
                [
                    appEntry.title,
                    appEntry.developerName,
                    appEntry.status,
                    status[appEntry.status],
                    lineFound,
                    !!appEntry.hidden_,
                ].join('|') + '\n',
            );

            console.log(
                lineFound,
                i,
                appEntry.title,
                appEntry.status,
                lineFound,
            );
            i++;
        }

        await Bun.write(`${paths.csv}/product-by-status.csv`, rows);
    }

    async runCSVProducts() {
        const lines = await this.getCSVLines();

        let i = 0;

        for (const line of lines) {
            const [externalReferenceCode, id, productName] = line.split(';');

            const isUUID = externalReferenceCode.includes('-');

            const where = {
                ...(isUUID && { title: productName }),
                ...(!isUUID && { appEntryId: Number(externalReferenceCode) }),
            } as any;

            const appEntry = await Prisma.oSB_AppEntry.findUnique({ where });

            if (appEntry === null) {
                i++;
                console.log(i, productName, appEntry === null);
            }
        }
    }
}

const appEntryDiff = new AppEntryDiff();

await appEntryDiff.run();

process.exit(0);
