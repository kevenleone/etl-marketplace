/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

class Cache {
    public cache = new Map<string, any>();
    private static instance: Cache;
    static KEYS = {
        JIRA_APP_ID_KEY: "JIRA_APP_ID_KEY",
    };

    public static getInstance(): Cache {
        if (!Cache.instance) {
            Cache.instance = new Cache();
        }

        return Cache.instance;
    }

    public get<T = any>(key: string): T | undefined {
        const cachedValue = this.cache.get(key);

        return cachedValue;
    }

    public has(key: string): boolean {
        return this.cache.has(key);
    }

    public set(key: string, value: unknown) {
        this.cache.set(key, value);
    }
}

export default Cache;
