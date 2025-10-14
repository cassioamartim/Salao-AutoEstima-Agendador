import { ensureRedisConnected, redis } from "./redisClient";

type CacheGetOptions = {
    ttlSeconds?: number;
}

export const CacheKeys = {
    usersList: "list:users",
    servicesList: "list:services",
    schedulingsList: "list:schedulings"
};

export const CacheTags = {
    users: "tag:users",
    services: "tag:services",
    schedulings: "tag:schedulings"
}

export async function getOrSetCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheGetOptions & { tag?: string } = {}
): Promise<T> {

    await ensureRedisConnected();

    const cached = await redis.get(key);

    if (cached) {
        try {
            return JSON.parse(cached) as T;
        } catch { }
    }

    const fresh = await fetcher();
    const payload = JSON.stringify(fresh);

    if (options?.ttlSeconds && options.ttlSeconds > 0) {
        await redis.set(key, payload, { EX: options.ttlSeconds });
    } else {
        await redis.set(key, payload);
    }

    if (options?.tag) {
        await redis.sAdd(options.tag, key);
    }

    return fresh;
}

export async function invalidateByTag(tag: string): Promise<void> {

    await ensureRedisConnected();

    const keys = await redis.sMembers(tag);

    if (keys.length > 0) {
        await redis.del(keys);
    }

    await redis.del(tag);
}