export function getFileName(response: Response) {
    const contentDisposition =
        response.headers.get('content-disposition') ?? '';

    const match = contentDisposition.match(
        /filename\*?=(?:UTF-8'')?["']?([^"';]+)/i,
    );

    return match ? decodeURIComponent(match[1]) : 'unknown-file';
}
