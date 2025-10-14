import { createClient } from "redis";

const redisConnectionURL = process.env['REDIS_URL'] || 'redis://localhost:6379';

export const redis = createClient({ url: redisConnectionURL })

redis.on('error', (err: unknown) => {
    console.error('Erro no Redis', err);
});

let connected = false;

export async function ensureRedisConnected(): Promise<void> {

    if (connected) return;

    if (!redis.isOpen) {
        await redis.connect();
    }

    connected = true;
}