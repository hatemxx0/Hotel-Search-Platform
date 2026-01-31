import { createClient } from 'redis';

let redisClient = null;

export async function initializeRedis() {
  if (!process.env.REDIS_URL) {
    console.log('⚠️  Redis URL not configured, caching disabled');
    return null;
  }

  try {
    redisClient = createClient({
      url: process.env.REDIS_URL,
      password: process.env.REDIS_PASSWORD || undefined,
      socket: {
        connectTimeout: 5000,
        lazyConnect: true,
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('❌ Redis: Too many reconnection attempts, giving up');
            return false;
          }
          const delay = Math.min(retries * 100, 3000);
          console.log(`🔄 Redis: Reconnecting in ${delay}ms (attempt ${retries})`);
          return delay;
        }
      }
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis Client Error:', err.message);
    });

    redisClient.on('connect', () => {
      console.log('🔗 Redis: Connected');
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis: Ready');
    });

    redisClient.on('end', () => {
      console.log('🔌 Redis: Connection ended');
    });

    redisClient.on('reconnecting', () => {
      console.log('🔄 Redis: Reconnecting...');
    });

    await redisClient.connect();
    
    // Test the connection
    await redisClient.ping();
    console.log('✅ Redis connection established successfully');
    
    return redisClient;
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
    redisClient = null;
    return null;
  }
}

export function getRedisClient() {
  return redisClient;
}

export async function setCache(key, value, ttl = null) {
  if (!redisClient || !redisClient.isOpen) {
    return false;
  }

  try {
    const serializedValue = JSON.stringify(value);
    const cacheTTL = ttl || parseInt(process.env.CACHE_TTL) || 3600;
    
    await redisClient.setEx(key, cacheTTL, serializedValue);
    return true;
  } catch (error) {
    console.error('❌ Redis SET error:', error.message);
    return false;
  }
}

export async function getCache(key) {
  if (!redisClient || !redisClient.isOpen) {
    return null;
  }

  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('❌ Redis GET error:', error.message);
    return null;
  }
}

export async function deleteCache(key) {
  if (!redisClient || !redisClient.isOpen) {
    return false;
  }

  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error('❌ Redis DEL error:', error.message);
    return false;
  }
}

export async function flushCache() {
  if (!redisClient || !redisClient.isOpen) {
    return false;
  }

  try {
    await redisClient.flushAll();
    return true;
  } catch (error) {
    console.error('❌ Redis FLUSH error:', error.message);
    return false;
  }
}