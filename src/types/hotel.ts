export interface Location {
  lat: number;
  lng: number;
}

export interface Hotel {
  id: string;
  name: string;
  address: string;
  rating: number;
  latitude: number;
  longitude: number;
  photos?: Array<{
    url?: string;
    photo_reference?: string;
  }>;
  price?: {
    amount: number;
    currency: string;
    period: string;
  };
  available: boolean;
  facilities?: string[];
  bookingUrl?: string;
  provider: string;
  error?: string;
}

export interface SearchResponse {
  hotels: Hotel[];
  metadata: SearchMetadata;
  error?: string;
}

export interface SearchParams {
  location: google.maps.LatLng;
  checkIn: string;
  checkOut: string;
  guests: number;
}

export interface SearchMetadata {
  total: number;
  available: number;
  unavailable: number;
  withPricing: number;
} 