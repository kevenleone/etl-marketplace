export const sanitize = (text: string) =>
    text
        .replaceAll("*", "")
        .replaceAll(",", "")
        .replaceAll(".", "")
        .replaceAll(" ", "")
        .replaceAll("/", "")
        .toLowerCase();
