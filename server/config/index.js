import dotenv from 'dotenv';

dotenv.config();

const config = {
  port: process.env.PORT || 3002,
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
    ttl: parseInt(process.env.REDIS_CACHE_TTL) || 3600
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },
  google: {
    placesApiKey: process.env.GOOGLE_PLACES_API_KEY,
    mapsApiKey: process.env.GOOGLE_MAPS_API_KEY
  }
};

export default config; 