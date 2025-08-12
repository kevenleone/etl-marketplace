import path from "path";

export { path };

export const paths = {
    data: path.join(import.meta.dir, "..", "..", "output", "data"),
    download: path.join(import.meta.dir, "..", "..", "output", "downloads"),
    developer: path.join(
        import.meta.dir,
        "..",
        "..",
        "output",
        "downloads",
        "developer"
    ),
    csv: path.join(import.meta.dir, "..", "..", "output", "csv"),
    logs: path.join(import.meta.dir, "..", "..", "output", "logs"),
    json: path.join(import.meta.dir, "..", "..", "output", "json"),
    metadata: path.join(import.meta.dir, "..", "..", "output", "metadata"),
    sql: path.join(import.meta.dir, "..", "..", "output", "sql"),
};
