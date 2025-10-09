// src/lib/redis.ts
import { Redis } from 'ioredis';

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var redis: Redis | undefined;
}

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.warn(
    '⚠️ REDIS_URL is not set. Redis cache will be disabled. Please set REDIS_URL in your environment variables.'
  );
}

const redisClient =
  global.redis ||
  (redisUrl
    ? new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: false,
      })
    : null);

if (process.env.NODE_ENV !== 'production') {
  global.redis = redisClient;
}

if (redisClient) {
  redisClient.on('connect', () => {
    console.log('✅ Connected to Redis');
  });

  redisClient.on('error', (err) => {
    console.error('❌ Redis connection error:', err);
  });
}

export default redisClient;
