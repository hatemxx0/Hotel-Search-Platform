import { Hotel, SearchParams, SearchResponse } from '../types/hotel';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';
const METERS_PER_KM = 1000;
const KM_PER_HOUR = 60;

// Calculate distance between two points using Haversine formula
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return Math.round(distance * METERS_PER_KM); // Convert to meters
};

// Convert distance to hours
export const distanceToHours = (meters: number): number => {
  return (meters / METERS_PER_KM) / KM_PER_HOUR;
};

// Search for nearby hotels using Google Places API
export const searchNearbyHotels = async (
  location: google.maps.LatLng,
  params?: Partial<SearchParams>
): Promise<SearchResponse> => {
  try {
    // Get tomorrow and the day after for check-in/check-out
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    // Format dates as YYYY-MM-DD
    const checkIn = params?.checkIn || tomorrow.toISOString().split('T')[0];
    const checkOut = params?.checkOut || dayAfter.toISOString().split('T')[0];

    const searchParams = new URLSearchParams({
      lat: location.lat().toString(),
      lng: location.lng().toString(),
      checkIn,
      checkOut,
      guests: (params?.guests || 2).toString()
    });

    console.log('Searching hotels with params:', searchParams.toString());

    const response = await fetch(`${API_BASE_URL}/api/hotels?${searchParams}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message || 
        `Failed to fetch hotels: ${response.status} ${response.statusText}`
      );
    }

    const data: SearchResponse = await response.json();
    
    // Calculate distances and add them to hotel objects
    const hotelsWithDistance = data.hotels.map(hotel => ({
      ...hotel,
      distance: calculateDistance(
        location.lat(),
        location.lng(),
        hotel.geometry.location.lat,
        hotel.geometry.location.lng
      )
    }));

    return {
      ...data,
      hotels: hotelsWithDistance
    };
  } catch (error) {
    console.error('Error fetching hotels:', error);
    throw error;
  }
};

// Get directions URL for Google Maps
export const getDirectionsUrl = (
  origin: google.maps.LatLng,
  destination: { lat: number; lng: number }
): string => {
  return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat()},${origin.lng()}&destination=${destination.lat},${destination.lng}`;
};

// Get map URL for Google Maps
export const getMapUrl = (lat: number, lng: number): string => {
  return `https://www.google.com/maps?q=${lat},${lng}`;
};

/**
 * Fetch hotel reviews from the backend API
 * @param placeId - Google Places ID of the hotel
 * @returns Promise with reviews data
 */
export const fetchHotelReviews = async (placeId: string) => {
  try {
    if (!placeId) {
      throw new Error('Place ID is required to fetch reviews');
    }

    const response = await fetch(`${API_BASE_URL}/api/reviews/${encodeURIComponent(placeId)}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message || 
        `Failed to fetch reviews: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log(`📖 Fetched ${data.total} reviews for place: ${placeId}`);
    
    return data;
  } catch (error) {
    console.error('Error fetching reviews:', error);
    throw error;
  }
}; 