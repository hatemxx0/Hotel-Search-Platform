import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { searchHotels } from './services/hotelService.js';
import { geocodeLocation } from './services/geocodingService.js';
import { getHotelReviews, calculateAverageRating } from './services/reviewService.js';
import { validateSearchQuery } from './middleware/validation.js';
import { initializeRedis, getRedisClient } from './config/redis.js';
import { getMetrics, resetMetrics } from './services/metricsService.js';
import { errorHandler } from './middleware/errorHandler.js';
import fetch from 'node-fetch';
import config from './config/index.js';

dotenv.config();

const app = express();
const PORT = config.port || 3002;

// Initialize Redis connection
await initializeRedis();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://maps.googleapis.com"]
    }
  }
}));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined'));

// CORS configuration
app.use(cors(config.cors));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please try again later.',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests from this IP. Please try again later.',
      retryAfter: Math.ceil(limiter.windowMs / 1000)
    });
  }
});

app.use('/api/', limiter);

// Health check endpoint
app.get('/health', async (req, res) => {
  const redis = getRedisClient();
  let redisStatus = 'disconnected';
  
  try {
    if (redis && redis.isOpen) {
      await redis.ping();
      redisStatus = 'connected';
    }
  } catch (error) {
    redisStatus = 'error';
  }

  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    redis: redisStatus,
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Metrics endpoint
app.get('/api/metrics', (req, res) => {
  if (process.env.ENABLE_METRICS !== 'true') {
    return res.status(404).json({ error: 'Metrics not enabled' });
  }
  
  const metrics = getMetrics();
  res.json({
    ...metrics,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Reset metrics endpoint (admin only)
app.post('/api/metrics/reset', (req, res) => {
  if (process.env.ENABLE_METRICS !== 'true') {
    return res.status(404).json({ error: 'Metrics not enabled' });
  }
  
  resetMetrics();
  res.json({ message: 'Metrics reset successfully' });
});

// Hotel search endpoint
app.get('/api/hotels', async (req, res) => {
  try {
    const { lat, lng, checkIn, checkOut, guests } = req.query;
    
    console.log(`🔍 Search request: lat=${lat}, lng=${lng}`);
    
    // Search hotels using coordinates
    const hotels = await searchHotels({
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      checkIn: checkIn || new Date().toISOString().split('T')[0],
      checkOut: checkOut || new Date(Date.now() + 86400000).toISOString().split('T')[0],
      guests: parseInt(guests) || 2
    });

    console.log(`🏨 Found ${hotels.length} hotels`);

    res.json({
      success: true,
      location: {
        coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) }
      },
      hotels,
      total: hotels.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Search error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Invalid request',
        message: error.message
      });
    }
    
    if (error.name === 'APIError') {
      return res.status(502).json({
        error: 'External API error',
        message: error.message || 'Failed to fetch hotels',
        provider: error.provider
      });
    }
    
    res.status(500).json({
      error: 'Search failed',
      message: 'An unexpected error occurred while searching for hotels. Please try again.'
    });
  }
});

// Google Places autocomplete proxy
app.get('/api/places/autocomplete', async (req, res) => {
  try {
    const { input } = req.query;
    
    if (!input || input.length < 2) {
      return res.json({ predictions: [] });
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=(cities)&key=${process.env.GOOGLE_PLACES_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status === 'OK') {
      res.json({
        predictions: data.predictions.map(prediction => ({
          description: prediction.description,
          place_id: prediction.place_id,
          structured_formatting: prediction.structured_formatting
        }))
      });
    } else {
      res.json({ predictions: [] });
    }

  } catch (error) {
    console.error('Places autocomplete error:', error);
    res.json({ predictions: [] });
  }
});

// Hotel reviews endpoint
app.get('/api/reviews/:placeId', async (req, res) => {
  try {
    const { placeId } = req.params;
    
    if (!placeId) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Place ID is required'
      });
    }

    console.log(`⭐ Fetching reviews for place: ${placeId}`);
    
    const reviews = await getHotelReviews(placeId);

    res.json({
      success: true,
      placeId,
      reviews,
      total: reviews.length,
      averageRating: calculateAverageRating(reviews),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Reviews error:', error);
    
    if (error.name === 'ReviewError') {
      return res.status(error.status || 500).json({
        error: 'Review fetch failed',
        message: error.message
      });
    }
    
    res.status(500).json({
      error: 'Review fetch failed',
      message: 'An unexpected error occurred while fetching reviews. Please try again.'
    });
  }
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested endpoint does not exist.'
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  
  const redis = getRedisClient();
  if (redis) {
    await redis.quit();
  }
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  
  const redis = getRedisClient();
  if (redis) {
    await redis.quit();
  }
  
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🏨 Hotel Search API running on port ${PORT}`);
  console.log(`📍 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Metrics enabled: ${process.env.ENABLE_METRICS === 'true'}`);
});