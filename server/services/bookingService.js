import { setCache, getCache } from '../config/redis.js';
import { trackAPICall } from './metricsService.js';
import fetch from 'node-fetch';

class BookingAPIError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'BookingAPIError';
    this.status = status;
    this.code = code;
  }
}

const BOOKING_API_BASE_URL = 'https://demandapi.booking.com/3.1';
const CACHE_TTL = parseInt(process.env.BOOKING_CACHE_TTL) || 1800; // 30 minutes default
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function makeBookingAPIRequest(endpoint, body, retryCount = 0) {
  try {
    const response = await fetch(`${BOOKING_API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.BOOKING_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Affiliate-Id': process.env.BOOKING_AFFILIATE_ID,
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle rate limiting
      if (response.status === 429 && retryCount < MAX_RETRIES) {
        const delay = RETRY_DELAY * Math.pow(2, retryCount);
        await new Promise(resolve => setTimeout(resolve, delay));
        return makeBookingAPIRequest(endpoint, body, retryCount + 1);
      }

      throw new BookingAPIError(
        data.message || 'Booking.com API request failed',
        response.status,
        data.code
      );
    }

    return data;
  } catch (error) {
    if (error instanceof BookingAPIError) {
      throw error;
    }
    throw new BookingAPIError(
      'Failed to connect to Booking.com API',
      500,
      'CONNECTION_ERROR'
    );
  }
}

export async function searchHotelsWithPricing({ latitude, longitude, checkIn, checkOut, guests }) {
  const cacheKey = `booking:hotels:${latitude}:${longitude}:${checkIn}:${checkOut}:${guests}`;

  // Try to get from cache first
  const cached = await getCache(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Track API call
    trackAPICall('booking', 'searchHotels');

    // Search for hotels
    const searchResponse = await makeBookingAPIRequest('/accommodations/search', {
      booker: {
        country: 'us' // Default to US, can be made configurable
      },
      currency: 'USD',
      route: {
        pickup: {
          datetime: checkIn,
          location: {
            coordinates: {
              latitude: parseFloat(latitude),
              longitude: parseFloat(longitude)
            }
          }
        },
        dropoff: {
          datetime: checkOut,
          location: {
            coordinates: {
              latitude: parseFloat(latitude),
              longitude: parseFloat(longitude)
            }
          }
        }
      }
    });

    // Get detailed information for each hotel
    const hotelIds = searchResponse.data.map(hotel => hotel.id);
    const detailsResponse = await makeBookingAPIRequest('/accommodations/details', {
      hotel_ids: hotelIds,
      extras: ['photos', 'facilities', 'policies', 'rooms']
    });

    // Combine search results with details
    const hotels = searchResponse.data.map(hotel => {
      const details = detailsResponse.data.find(d => d.id === hotel.id) || {};
      
      return {
        id: `booking_${hotel.id}`,
        name: hotel.name,
        address: hotel.address,
        rating: hotel.rating || 0,
        starRating: hotel.star_rating || 0,
        latitude: hotel.latitude,
        longitude: hotel.longitude,
        price: {
          amount: hotel.price?.total || 0,
          currency: hotel.price?.currency || 'USD',
          period: 'per night'
        },
        photos: details.photos?.map(photo => ({
          url: photo.url,
          width: photo.width,
          height: photo.height
        })) || [],
        facilities: details.facilities || [],
        policies: details.policies || {},
        rooms: details.rooms || [],
        bookingUrl: hotel.url,
        provider: 'booking.com'
      };
    });

    // Cache the results
    await setCache(cacheKey, hotels, CACHE_TTL);

    return hotels;
  } catch (error) {
    console.error('Booking.com API error:', error);
    throw error;
  }
}

export async function getHotelDetails(hotelId) {
  const cacheKey = `booking:hotel:${hotelId}`;

  // Try to get from cache first
  const cached = await getCache(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Track API call
    trackAPICall('booking', 'getHotelDetails');

    const response = await makeBookingAPIRequest('/accommodations/details', {
      hotel_ids: [hotelId],
      extras: ['photos', 'facilities', 'policies', 'rooms', 'reviews']
    });

    if (!response.data || response.data.length === 0) {
      throw new BookingAPIError('Hotel not found', 404, 'HOTEL_NOT_FOUND');
    }

    const hotel = response.data[0];
    const formattedHotel = {
      id: `booking_${hotel.id}`,
      name: hotel.name,
      address: hotel.address,
      rating: hotel.rating || 0,
      starRating: hotel.star_rating || 0,
      latitude: hotel.latitude,
      longitude: hotel.longitude,
      photos: hotel.photos?.map(photo => ({
        url: photo.url,
        width: photo.width,
        height: photo.height
      })) || [],
      facilities: hotel.facilities || [],
      policies: hotel.policies || {},
      rooms: hotel.rooms || [],
      reviews: hotel.reviews || [],
      provider: 'booking.com'
    };

    // Cache the results
    await setCache(cacheKey, formattedHotel, CACHE_TTL);

    return formattedHotel;
  } catch (error) {
    console.error('Booking.com API error:', error);
    throw error;
  }
} 