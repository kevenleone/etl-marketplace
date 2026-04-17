export function safeJSONParse<T = any>(
    value: string | null,
    defaultValue: T,
): T {
    if (defaultValue && typeof value !== 'string') {
        return defaultValue as T;
    }

    try {
        return JSON.parse(value as string);
    } catch {
        return defaultValue;
    }
}
