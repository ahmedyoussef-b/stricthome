// src/lib/redis.ts
import { Redis } from 'ioredis';

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var redis: Redis | undefined;
}

const redisUrl = process.env.REDIS_URL;
let redisClient: Redis | null = null;

if (global.redis) {
  redisClient = global.redis;
} else if (redisUrl) {
  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
    });

    redisClient.on('connect', () => {
      console.log('✅ Connected to Redis');
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis connection error:', err);
      // If connection fails, we might want to nullify the client
      // to prevent further attempts, but ioredis has its own retry logic.
      // For now, just logging is fine.
    });

    if (process.env.NODE_ENV !== 'production') {
      global.redis = redisClient;
    }
  } catch (error) {
     console.error('❌ Failed to initialize Redis client:', error);
     redisClient = null;
  }
}

if (!redisClient) {
    console.warn(
    '⚠️ REDIS_URL is not set or invalid. Redis cache will be disabled.'
  );
}

export default redisClient;
