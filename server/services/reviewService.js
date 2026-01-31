import { setCache, getCache } from '../config/redis.js';
import { trackAPICall } from './metricsService.js';
import fetch from 'node-fetch';

class ReviewError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = 'ReviewError';
    this.status = status;
  }
}

/**
 * Fetch reviews for a specific hotel using Google Places API
 * @param {string} placeId - The Google Places ID of the hotel
 * @returns {Promise<Array>} Array of review objects
 */
export async function getHotelReviews(placeId) {
  if (!placeId || typeof placeId !== 'string') {
    throw new ReviewError('Invalid place ID provided', 400);
  }

  const cacheKey = `reviews:${placeId}`;

  try {
    // Check Redis cache first
    const cached = await getCache(cacheKey);
    if (cached) {
      console.log(`⭐ Reviews cache hit for place: ${placeId}`);
      return cached;
    }

    // Fetch from Google Places API
    const reviews = await trackAPICall('google_places_reviews', async () => {
      return await fetchFromGooglePlaces(placeId);
    });

    // Cache results for 12 hours
    if (reviews && reviews.length > 0) {
      await setCache(cacheKey, reviews, 43200);
      console.log(`⭐ Cached ${reviews.length} reviews for place: ${placeId}`);
    }

    return reviews || [];

  } catch (error) {
    console.error(`❌ Review fetch error for "${placeId}":`, error.message);
    
    if (error instanceof ReviewError) {
      throw error;
    }
    
    throw new ReviewError('Failed to fetch reviews from external service');
  }
}

/**
 * Fetch reviews from Google Places API
 * @param {string} placeId - Google Places ID
 * @returns {Promise<Array>} Array of reviews
 */
async function fetchFromGooglePlaces(placeId) {
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    throw new ReviewError('Google Places API key not configured');
  }

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total&key=${process.env.GOOGLE_PLACES_API_KEY}`;

  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🌐 Fetching reviews (attempt ${attempt}) for place: ${placeId}`);
      
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
          const waitTime = Math.pow(2, attempt) * 1000;
          console.log(`⏳ Rate limited, waiting ${waitTime}ms`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        throw new ReviewError(`Google API HTTP ${response.status}`, response.status);
      }
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.result) {
        const reviews = data.result.reviews || [];
        return reviews.map(review => ({
          author: review.author_name,
          rating: review.rating,
          text: review.text,
          time: review.time,
          relative_time_description: review.relative_time_description
        }));
      } else if (data.status === 'ZERO_RESULTS') {
        return [];
      } else if (data.status === 'OVER_QUERY_LIMIT') {
        const waitTime = Math.pow(2, attempt) * 2000;
        console.log(`⏳ Over query limit, waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      throw new ReviewError(`Google API error: ${data.status}`, 500);

    } catch (error) {
      lastError = error;
      if (error instanceof ReviewError && error.status === 400) {
        throw error;
      }
    }
  }

  throw lastError || new ReviewError('Failed to fetch reviews after retries');
}

/**
 * Get average review rating
 * @param {Array} reviews - Array of review objects
 * @returns {number} Average rating
 */
export function calculateAverageRating(reviews) {
  if (!reviews || reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}
