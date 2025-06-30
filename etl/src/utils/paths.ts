import path from "path";

export { path };

export const paths = {
    data: path.join(import.meta.dir, "..", "..", "import", "data"),
    download: path.join(import.meta.dir, "..", "..", "import", "downloads"),
    developer: path.join(
        import.meta.dir,
        "..",
        "..",
        "import",
        "downloads",
        "developer"
    ),
    csv: path.join(import.meta.dir, "..", "..", "import", "csv"),
    logs: path.join(import.meta.dir, "..", "..", "import", "logs"),
    json: path.join(import.meta.dir, "..", "..", "import", "json"),
    metadata: path.join(import.meta.dir, "..", "..", "import", "metadata"),
    sql: path.join(import.meta.dir, "..", "..", "import", "sql"),
    test: path.join(import.meta.dir, "..", "..", "import", "TEST"),
};
