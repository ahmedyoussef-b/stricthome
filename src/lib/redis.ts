// src/lib/redis.ts
import { Redis } from 'ioredis';

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var redis: Redis | undefined;
}

const redisUrl = process.env.REDIS_URL;
let redisClient: Redis | null = null;

if (redisUrl) {
  if (global.redis) {
    redisClient = global.redis;
  } else {
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
        // Nullify the client on a fatal connection error to stop retries.
        redisClient = null; 
      });

      if (process.env.NODE_ENV !== 'production') {
        global.redis = redisClient;
      }
    } catch (error) {
       console.error('❌ Failed to initialize Redis client:', error);
       redisClient = null;
    }
  }
}

if (!redisClient) {
    console.warn(
    '⚠️ REDIS_URL is not set or invalid. Redis cache will be disabled.'
  );
}

export default redisClient;
