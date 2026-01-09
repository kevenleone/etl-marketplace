import { paths } from '../utils/paths';

type Headers = {
    name: string;
    label: string;
    render?: (key: string, item: any) => void;
};

export default class CSV {
    constructor(
        private headers: Headers[],
        private rows: any[],
    ) {}

    private escape(value: any): string {
        if (value == null) return '';

        let str = String(value);

        // If the value contains a comma, quote, or newline, wrap it in quotes
        if (/[",\n]/.test(str)) {
            // Escape inner quotes by doubling them
            str = str.replace(/"/g, '""');
            return `"${str}"`;
        }

        return str;
    }

    async save(filename: string) {
        const lines = [];

        // Header row
        lines.push(this.headers.map((h) => this.escape(h.label)).join(','));

        // Data rows
        for (const row of this.rows) {
            const cells = this.headers.map((header) => {
                const item = row[header.name];
                const value = header.render ? header.render(item, row) : item;
                return this.escape(value);
            });

            lines.push(cells.join(','));
        }

        const entries = lines.join('\n');

        await Bun.write(`${paths.json}/${filename}`, entries);
    }
}
