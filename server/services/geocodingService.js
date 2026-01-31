import { setCache, getCache } from '../config/redis.js';
import { trackAPICall } from './metricsService.js';

class GeocodingError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = 'GeocodingError';
    this.status = status;
  }
}

export async function geocodeLocation(location) {
  if (!location || typeof location !== 'string' || location.trim().length < 2) {
    throw new GeocodingError('Invalid location provided', 400);
  }

  const normalizedLocation = location.trim().toLowerCase();
  const cacheKey = `geocode:${normalizedLocation}`;

  try {
    // Try cache first
    const cached = await getCache(cacheKey);
    if (cached) {
      console.log(`📍 Geocoding cache hit for: ${location}`);
      return cached;
    }

    // Call Google Geocoding API
    const result = await trackAPICall('google_geocoding', async () => {
      return await callGoogleGeocodingAPI(location);
    });

    if (result) {
      // Cache successful result for 24 hours
      await setCache(cacheKey, result, 86400);
      console.log(`📍 Geocoded and cached: ${location} -> ${result.lat}, ${result.lng}`);
    }

    return result;

  } catch (error) {
    console.error(`❌ Geocoding error for "${location}":`, error.message);
    
    if (error instanceof GeocodingError) {
      throw error;
    }
    
    throw new GeocodingError('Geocoding service temporarily unavailable');
  }
}

async function callGoogleGeocodingAPI(location) {
  if (!process.env.GOOGLE_GEOCODING_API_KEY) {
    throw new GeocodingError('Google Geocoding API key not configured');
  }

  const encodedLocation = encodeURIComponent(location);
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedLocation}&key=${process.env.GOOGLE_GEOCODING_API_KEY}`;
  
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🌐 Geocoding API call (attempt ${attempt}): ${location}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'HotelSearch/1.0'
        },
        timeout: 10000
      });
      
      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited - wait and retry
          const waitTime = Math.pow(2, attempt) * 1000;
          console.log(`⏳ Google Geocoding rate limited, waiting ${waitTime}ms`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        throw new GeocodingError(`Google Geocoding API HTTP ${response.status}`, response.status);
      }
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return {
          lat: location.lat,
          lng: location.lng,
          formatted_address: data.results[0].formatted_address,
          place_id: data.results[0].place_id
        };
      } else if (data.status === 'ZERO_RESULTS') {
        return null;
      } else if (data.status === 'OVER_QUERY_LIMIT') {
        throw new GeocodingError('Google Geocoding quota exceeded', 429);
      } else if (data.status === 'REQUEST_DENIED') {
        throw new GeocodingError('Google Geocoding API access denied', 403);
      } else if (data.status === 'INVALID_REQUEST') {
        throw new GeocodingError('Invalid geocoding request', 400);
      } else {
        throw new GeocodingError(`Geocoding failed: ${data.status}`);
      }
      
    } catch (error) {
      lastError = error;
      
      if (error instanceof GeocodingError) {
        throw error;
      }
      
      if (attempt === maxRetries) break;
      
      // Wait before retry
      const waitTime = Math.pow(2, attempt) * 1000;
      console.log(`⏳ Geocoding retry in ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError || new GeocodingError('Geocoding service unavailable after retries');
}

// Reverse geocoding (coordinates to address)
export async function reverseGeocode(lat, lng) {
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    throw new GeocodingError('Invalid coordinates provided', 400);
  }

  const cacheKey = `reverse_geocode:${lat},${lng}`;

  try {
    // Try cache first
    const cached = await getCache(cacheKey);
    if (cached) {
      console.log(`📍 Reverse geocoding cache hit for: ${lat}, ${lng}`);
      return cached;
    }

    // Call Google Geocoding API
    const result = await trackAPICall('google_reverse_geocoding', async () => {
      return await callGoogleReverseGeocodingAPI(lat, lng);
    });

    if (result) {
      // Cache successful result for 24 hours
      await setCache(cacheKey, result, 86400);
      console.log(`📍 Reverse geocoded and cached: ${lat}, ${lng} -> ${result.formatted_address}`);
    }

    return result;

  } catch (error) {
    console.error(`❌ Reverse geocoding error for ${lat}, ${lng}:`, error.message);
    throw error;
  }
}

async function callGoogleReverseGeocodingAPI(lat, lng) {
  if (!process.env.GOOGLE_GEOCODING_API_KEY) {
    throw new GeocodingError('Google Geocoding API key not configured');
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.GOOGLE_GEOCODING_API_KEY}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'HotelSearch/1.0'
    },
    timeout: 10000
  });
  
  if (!response.ok) {
    throw new GeocodingError(`Google Reverse Geocoding API HTTP ${response.status}`, response.status);
  }
  
  const data = await response.json();
  
  if (data.status === 'OK' && data.results && data.results.length > 0) {
    return {
      formatted_address: data.results[0].formatted_address,
      place_id: data.results[0].place_id,
      address_components: data.results[0].address_components
    };
  } else if (data.status === 'ZERO_RESULTS') {
    return null;
  } else {
    throw new GeocodingError(`Reverse geocoding failed: ${data.status}`);
  }
}