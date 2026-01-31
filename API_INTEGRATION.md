# API Integration Guide

This document provides detailed instructions for integrating with TBO, WebBeds, and Google APIs for the Hotel Search platform.

## 🗝️ API Credentials Setup

### TBO API Setup

1. **Registration**
   - Visit [TBO Developer Portal](https://developer.tbo.com)
   - Create an account and apply for API access
   - Wait for approval (typically 1-3 business days)

2. **Credentials**
   ```env
   TBO_API_KEY=your_api_key_here
   TBO_SHARED_SECRET=your_shared_secret_here
   TBO_API_URL=https://api.tbo.com/v1
   ```

3. **Authentication**
   - TBO uses API Key + Shared Secret authentication
   - Include both in headers for all requests

### WebBeds API Setup

1. **Registration**
   - Apply through [WebBeds Partner Portal](https://www.webbeds.com/partners)
   - Complete partner application process
   - Provide business documentation

2. **Credentials**
   ```env
   WEBBEDS_API_KEY=your_api_key_here
   WEBBEDS_API_SECRET=your_api_secret_here
   WEBBEDS_API_URL=https://api.webbeds.com/v1
   ```

3. **Authentication**
   - Uses API Key + Secret for request signing
   - Requires HMAC signature for security

### Google APIs Setup

1. **Google Cloud Console**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create new project or select existing one
   - Enable required APIs:
     - Places API (for autocomplete)
     - Geocoding API (for location conversion)

2. **API Keys**
   ```env
   GOOGLE_PLACES_API_KEY=your_places_api_key
   GOOGLE_GEOCODING_API_KEY=your_geocoding_api_key
   ```

3. **Security**
   - Restrict API keys by:
     - HTTP referrers (for frontend)
     - IP addresses (for backend)
     - Specific APIs only

## 🔌 Production API Implementation

### TBO Integration

Replace the mock implementation in `server/services/hotelService.js`:

```javascript
import crypto from 'crypto';

async function searchTBOHotels({ latitude, longitude, checkIn, checkOut, guests }) {
  try {
    // Generate authentication signature
    const timestamp = Date.now();
    const signature = generateTBOSignature(timestamp);
    
    const response = await fetch(`${process.env.TBO_API_URL}/hotel/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.TBO_API_KEY}`,
        'X-Timestamp': timestamp.toString(),
        'X-Signature': signature,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        searchCriteria: {
          destination: {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude)
          },
          checkIn: checkIn,
          checkOut: checkOut,
          rooms: [{
            adults: guests,
            children: 0
          }]
        },
        sortBy: 'price',
        currency: 'USD'
      })
    });

    if (!response.ok) {
      throw new Error(`TBO API error: ${response.status}`);
    }

    const data = await response.json();
    return normalizeTBOResponse(data);
    
  } catch (error) {
    console.error('TBO API error:', error);
    throw new Error('Failed to fetch hotels from TBO');
  }
}

function generateTBOSignature(timestamp) {
  const message = `${process.env.TBO_API_KEY}${timestamp}`;
  return crypto
    .createHmac('sha256', process.env.TBO_SHARED_SECRET)
    .update(message)
    .digest('hex');
}

function normalizeTBOResponse(data) {
  return data.hotels?.map(hotel => ({
    id: `tbo_${hotel.hotelId}`,
    name: hotel.hotelName,
    address: hotel.address,
    starRating: hotel.starRating || 0,
    image: hotel.images?.[0]?.url || getDefaultImage(),
    price: {
      amount: Math.round(hotel.price?.amount || 0),
      currency: hotel.price?.currency || 'USD',
      period: 'per night'
    },
    amenities: hotel.amenities || [],
    source: 'TBO'
  })) || [];
}
```

### WebBeds Integration

```javascript
async function searchWebBedsHotels({ latitude, longitude, checkIn, checkOut, guests }) {
  try {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      checkIn,
      checkOut,
      guests: guests.toString(),
      currency: 'USD',
      radius: '50' // 50km radius
    });

    const signature = generateWebBedsSignature('GET', `/hotels?${params}`);
    
    const response = await fetch(`${process.env.WEBBEDS_API_URL}/hotels?${params}`, {
      headers: {
        'X-API-Key': process.env.WEBBEDS_API_KEY,
        'X-Signature': signature,
        'X-Timestamp': Date.now().toString(),
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`WebBeds API error: ${response.status}`);
    }

    const data = await response.json();
    return normalizeWebBedsResponse(data);
    
  } catch (error) {
    console.error('WebBeds API error:', error);
    throw new Error('Failed to fetch hotels from WebBeds');
  }
}

function generateWebBedsSignature(method, path) {
  const timestamp = Date.now();
  const message = `${method}${path}${timestamp}`;
  return crypto
    .createHmac('sha256', process.env.WEBBEDS_API_SECRET)
    .update(message)
    .digest('hex');
}

function normalizeWebBedsResponse(data) {
  return data.results?.map(hotel => ({
    id: `webbeds_${hotel.id}`,
    name: hotel.name,
    address: hotel.location?.address,
    starRating: hotel.category || 0,
    image: hotel.media?.[0]?.uri || getDefaultImage(),
    price: {
      amount: Math.round(hotel.rates?.[0]?.net || 0),
      currency: hotel.rates?.[0]?.currency || 'USD',
      period: 'per night'
    },
    amenities: hotel.amenities?.map(a => a.description) || [],
    source: 'WebBeds'
  })) || [];
}
```

### Google Geocoding Integration

Replace the mock implementation in `server/services/geocodingService.js`:

```javascript
export async function geocodeLocation(location) {
  try {
    const encodedLocation = encodeURIComponent(location);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedLocation}&key=${process.env.GOOGLE_GEOCODING_API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lng };
    } else if (data.status === 'ZERO_RESULTS') {
      return null;
    } else {
      throw new Error(`Geocoding failed: ${data.status}`);
    }
    
  } catch (error) {
    console.error('Geocoding error:', error);
    throw new Error('Failed to geocode location');
  }
}
```

## 🏗️ Enhanced Service Implementation

Update `server/services/hotelService.js` with production logic:

```javascript
export async function searchHotels({ latitude, longitude, checkIn, checkOut, guests }) {
  try {
    // Run both API calls in parallel for better performance
    const [tboResults, webbedsResults] = await Promise.allSettled([
      searchTBOHotels({ latitude, longitude, checkIn, checkOut, guests }),
      searchWebBedsHotels({ latitude, longitude, checkIn, checkOut, guests })
    ]);

    let allHotels = [];

    // Process TBO results
    if (tboResults.status === 'fulfilled') {
      allHotels.push(...tboResults.value);
    } else {
      console.error('TBO search failed:', tboResults.reason);
    }

    // Process WebBeds results
    if (webbedsResults.status === 'fulfilled') {
      allHotels.push(...webbedsResults.value);
    } else {
      console.error('WebBeds search failed:', webbedsResults.reason);
    }

    // Remove duplicates and sort
    const uniqueHotels = removeDuplicateHotels(allHotels);
    const sortedHotels = sortHotelsByRelevance(uniqueHotels);

    return sortedHotels;
    
  } catch (error) {
    console.error('Hotel search error:', error);
    throw error;
  }
}

function removeDuplicateHotels(hotels) {
  const seen = new Set();
  return hotels.filter(hotel => {
    // Use name + address as uniqueness key
    const key = `${hotel.name.toLowerCase()}_${hotel.address?.toLowerCase()}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function sortHotelsByRelevance(hotels) {
  return hotels.sort((a, b) => {
    // Sort by star rating first, then by price
    if (a.starRating !== b.starRating) {
      return b.starRating - a.starRating;
    }
    return a.price.amount - b.price.amount;
  });
}

function getDefaultImage() {
  const defaultImages = [
    'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/271619/pexels-photo-271619.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg?auto=compress&cs=tinysrgb&w=800'
  ];
  return defaultImages[Math.floor(Math.random() * defaultImages.length)];
}
```

## 💾 Caching Implementation

Add Redis caching to improve performance:

```javascript
import Redis from 'redis';

const redis = process.env.REDIS_URL ? Redis.createClient({
  url: process.env.REDIS_URL
}) : null;

if (redis) {
  redis.on('error', (err) => console.error('Redis Client Error', err));
  await redis.connect();
}

export async function searchHotels({ latitude, longitude, checkIn, checkOut, guests }) {
  // Create cache key
  const cacheKey = `hotels:${latitude}:${longitude}:${checkIn}:${checkOut}:${guests}`;
  
  // Try to get from cache first
  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        console.log('Returning cached results');
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('Cache read error:', error);
    }
  }

  // If not in cache, fetch from APIs
  const results = await performHotelSearch({ latitude, longitude, checkIn, checkOut, guests });
  
  // Cache the results
  if (redis && results.length > 0) {
    try {
      await redis.setEx(cacheKey, parseInt(process.env.CACHE_TTL) || 3600, JSON.stringify(results));
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  return results;
}
```

## 🚦 Rate Limiting & Error Handling

Add comprehensive error handling:

```javascript
class APIError extends Error {
  constructor(message, status, provider) {
    super(message);
    this.status = status;
    this.provider = provider;
    this.name = 'APIError';
  }
}

async function makeAPIRequest(url, options, provider) {
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        // Rate limited - wait and retry
        const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`Rate limited by ${provider}, waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      if (!response.ok) {
        throw new APIError(`HTTP ${response.status}`, response.status, provider);
      }
      
      return await response.json();
      
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries) break;
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  throw lastError;
}
```

## 📊 Monitoring & Analytics

Add API usage monitoring:

```javascript
const apiMetrics = {
  tbo: { requests: 0, errors: 0, totalTime: 0 },
  webbeds: { requests: 0, errors: 0, totalTime: 0 }
};

async function trackAPICall(provider, apiCall) {
  const startTime = Date.now();
  apiMetrics[provider].requests++;
  
  try {
    const result = await apiCall();
    apiMetrics[provider].totalTime += Date.now() - startTime;
    return result;
  } catch (error) {
    apiMetrics[provider].errors++;
    apiMetrics[provider].totalTime += Date.now() - startTime;
    throw error;
  }
}

// Endpoint to get API metrics
app.get('/api/metrics', (req, res) => {
  res.json({
    ...apiMetrics,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});
```

This comprehensive API integration guide provides production-ready implementations for all external APIs with proper error handling, caching, and monitoring.