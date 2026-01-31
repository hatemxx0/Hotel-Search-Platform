import { setCache, getCache } from '../config/redis.js';
import { trackAPICall } from './metricsService.js';
import fetch from 'node-fetch';
import { searchHotelsWithPricing as searchBookingHotels, getHotelDetails } from './bookingService.js';

class APIError extends Error {
  constructor(message, status, provider) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.provider = provider;
  }
}

// Constants for price calculation (used as fallback for Google Places)
const BASE_PRICE = 50; // Base price in EUR
const PRICE_MULTIPLIER = {
  1: 1,    // Budget: 50 EUR
  2: 2,    // Economy: 100 EUR
  3: 4,    // Mid-range: 200 EUR
  4: 8,    // Upscale: 400 EUR
  5: 16    // Luxury: 800 EUR
};

export async function searchHotels({ latitude, longitude, checkIn, checkOut, guests }) {
  // Validate inputs
  if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
    throw new Error('Invalid coordinates provided');
  }
  
  if (!checkIn || !checkOut) {
    throw new Error('Check-in and check-out dates are required');
  }
  
  const guestCount = parseInt(guests) || 2;
  if (guestCount < 1 || guestCount > 10) {
    throw new Error('Guest count must be between 1 and 10');
  }

  try {
    // First, search for hotels using Google Places API
    console.log('🔍 Searching hotels using Google Places API...');
    
    const radius = 50000; // 50km radius
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=lodging&key=${process.env.GOOGLE_PLACES_API_KEY}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new APIError(`Google Places API error: ${response.status}`, response.status, 'google');
    }

    const data = await response.json();
    
    if (data.status !== 'OK') {
      console.error('Google Places API error:', data);
      throw new APIError('Failed to fetch hotels: ' + (data.error_message || data.status), 500, 'google');
    }

    // Transform Google Places results
    const googleHotels = data.results.map(place => ({
      id: place.place_id,
      name: place.name,
      address: place.vicinity,
      rating: place.rating || 0,
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
      photos: place.photos || [],
      types: place.types,
      googleData: {
        place_id: place.place_id,
        rating: place.rating,
        user_ratings_total: place.user_ratings_total
      }
    }));

    // Now enrich with Booking.com data
    console.log('💰 Enriching with Booking.com pricing data...');
    
    const enrichedHotels = await enrichHotelsWithPricing(googleHotels, {
      checkIn,
      checkOut,
      guests: guestCount
    });

    // Sort hotels by availability and price
    const sortedHotels = enrichedHotels.sort((a, b) => {
      // First, sort by availability
      if (a.available !== b.available) {
        return a.available ? -1 : 1;
      }
      // Then by price (if both have prices)
      if (a.price?.amount && b.price?.amount) {
        return a.price.amount - b.price.amount;
      }
      // Put hotels with prices first
      if (a.price?.amount) return -1;
      if (b.price?.amount) return 1;
      // Finally, sort by rating
      return b.rating - a.rating;
    });

    return {
      hotels: sortedHotels,
      metadata: {
        total: sortedHotels.length,
        available: sortedHotels.filter(h => h.available).length,
        unavailable: sortedHotels.filter(h => !h.available).length,
        withPricing: sortedHotels.filter(h => h.price?.amount > 0).length
      }
    };

  } catch (error) {
    console.error('❌ Hotel search error:', error);
    throw error;
  }
}

async function enrichHotelsWithPricing(hotels, { checkIn, checkOut, guests }) {
  // Create cache key
  const cacheKey = `hotel-pricing:${checkIn}:${checkOut}:${guests}:${hotels.map(h => h.id).join(',')}`;
  
  // Try to get from cache
  const cached = await getCache(cacheKey);
  if (cached) {
    return cached;
  }

  // Process hotels in batches to avoid overwhelming the API
  const BATCH_SIZE = 10;
  const enrichedHotels = [];
  
  for (let i = 0; i < hotels.length; i += BATCH_SIZE) {
    const batch = hotels.slice(i, i + BATCH_SIZE);
    
    try {
      // Search for these hotels in Booking.com by location
      const bookingResults = await searchBookingHotels({
        latitude: batch[0].latitude,
        longitude: batch[0].longitude,
        checkIn,
        checkOut,
        guests
      });

      // Match Booking.com results with Google Places hotels
      for (const googleHotel of batch) {
        const bookingMatch = findBestBookingMatch(googleHotel, bookingResults);
        
        if (bookingMatch) {
          enrichedHotels.push({
            ...googleHotel,
            price: bookingMatch.price,
            rooms: bookingMatch.rooms,
            available: true,
            bookingId: bookingMatch.id,
            bookingUrl: bookingMatch.bookingUrl,
            facilities: bookingMatch.facilities,
            policies: bookingMatch.policies
          });
        } else {
          // No matching hotel found in Booking.com
          enrichedHotels.push({
            ...googleHotel,
            available: false,
            price: null
          });
        }
      }
    } catch (error) {
      console.error(`Failed to enrich batch ${i}-${i + BATCH_SIZE}:`, error);
      // Continue with next batch, don't fail entirely
      enrichedHotels.push(...batch.map(hotel => ({
        ...hotel,
        available: false,
        price: null,
        error: 'Failed to fetch pricing'
      })));
    }
    
    // Small delay between batches to respect rate limits
    if (i + BATCH_SIZE < hotels.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Cache the results
  await setCache(cacheKey, enrichedHotels, 1800); // 30 minutes cache

  return enrichedHotels;
}

function findBestBookingMatch(googleHotel, bookingHotels) {
  if (!bookingHotels || bookingHotels.length === 0) return null;

  // Try exact name match first
  const exactMatch = bookingHotels.find(bh => 
    bh.name.toLowerCase() === googleHotel.name.toLowerCase()
  );
  if (exactMatch) return exactMatch;

  // Calculate string similarity and distance for each hotel
  const matches = bookingHotels.map(bh => ({
    hotel: bh,
    score: calculateMatchScore(googleHotel, bh)
  }));

  // Sort by score and get the best match
  matches.sort((a, b) => b.score - a.score);
  
  // Return the best match if it exceeds our threshold
  return matches[0].score > 0.7 ? matches[0].hotel : null;
}

function calculateMatchScore(googleHotel, bookingHotel) {
  // Name similarity (50% of score)
  const nameSimilarity = calculateStringSimilarity(
    googleHotel.name.toLowerCase(),
    bookingHotel.name.toLowerCase()
  ) * 0.5;

  // Location proximity (30% of score)
  const distance = calculateDistance(
    googleHotel.latitude,
    googleHotel.longitude,
    bookingHotel.latitude,
    bookingHotel.longitude
  );
  const distanceScore = Math.max(0, 1 - (distance / 500)) * 0.3; // Max 500 meters

  // Rating similarity (20% of score)
  const ratingSimilarity = googleHotel.rating && bookingHotel.rating ?
    (1 - Math.abs(googleHotel.rating - bookingHotel.rating) / 5) * 0.2 : 0;

  return nameSimilarity + distanceScore + ratingSimilarity;
}

function calculateStringSimilarity(str1, str2) {
  // Simple Levenshtein distance implementation
  const m = str1.length;
  const n = str2.length;
  const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j - 1] + 1,
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1
        );
      }
    }
  }

  const maxLength = Math.max(m, n);
  return 1 - (dp[m][n] / maxLength);
}

// Helper function to calculate distance between two points in meters
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return Math.round(R * c); // Distance in meters
}