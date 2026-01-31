/// <reference types="react" />
/// <reference types="google.maps" />

import React, { useState, useEffect, useRef } from 'react';
import SearchBar from './components/SearchBar';
import Map from './components/Map';
import ErrorBoundary from './components/ErrorBoundary';
import StarSection from './components/StarSection';
import DemoMode from './components/DemoMode';
import { searchNearbyHotels } from './utils/api';
import { Hotel, SearchResponse, SearchParams, SearchMetadata } from './types/hotel';
import HotelTable from './components/HotelTable';
import { SearchForm } from './components/SearchForm';
import { HotelGrid } from './components/HotelGrid';
import { ErrorMessage } from './components/ErrorMessage';
import { LoadingState } from './components/LoadingState';

interface AppState {
  searchLocation: google.maps.LatLng | null;
  hotels: Hotel[];
  loading: boolean;
  error: string | null;
  isDemoMode: boolean;
  mapCenter: google.maps.LatLngLiteral;
  searchMetadata: SearchMetadata | null;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      div: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
      header: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      h1: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      main: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      section: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

// Constants for filtering
const MAX_PRICE_EUR = 200;
const MAX_DISTANCE_HOURS = 2;
const PRICE_MULTIPLIER = 50; // Each price level represents €50

// Helper function to check if a hotel meets premium criteria
const meetsPremiumCriteria = (hotel: Hotel): boolean => {
  const priceEur = (hotel.priceLevel || 0) * PRICE_MULTIPLIER;
  const distanceHours = (hotel.distance / 1000) / 60; // Convert meters to hours (assuming 60 km/h)
  return priceEur <= MAX_PRICE_EUR && distanceHours <= MAX_DISTANCE_HOURS;
};

// Filter hotels by rating and criteria
const filterHotels = (hotels: Hotel[], targetRating: number, requirePremium: boolean = true): Hotel[] => {
  return hotels.filter(hotel => {
    const rating = Math.floor(hotel.rating);
    if (rating !== targetRating) return false;
    return !requirePremium || meetsPremiumCriteria(hotel);
  });
};

// Get other hotels that don't fit in main categories
const getOtherHotels = (hotels: Hotel[]): Hotel[] => {
  return hotels.filter(hotel => {
    const rating = Math.floor(hotel.rating);
    if (rating >= 3 && rating <= 5) {
      return !meetsPremiumCriteria(hotel);
    }
    return true; // Include all hotels with ratings < 3 or > 5
  });
};

function App() {
  const [state, setState] = useState<AppState>({
    searchLocation: null,
    hotels: [],
    loading: false,
    error: null,
    isDemoMode: false,
    mapCenter: {
      lat: 40.7128,
      lng: -74.0060
    },
    searchMetadata: null
  });

  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let timeoutId: number;
    let attempts = 0;
    const MAX_ATTEMPTS = 50; // 5 seconds total

    function checkGoogleMapsLoaded() {
      // Check if the script is loaded and Maps API is initialized
      if (window.google?.maps?.Map) {
        console.log('Google Maps API fully loaded and initialized');
        setState((prev: AppState) => ({ ...prev, isDemoMode: false }));
        clearTimeout(timeoutId);
      } else if (attempts < MAX_ATTEMPTS) {
        console.log(`Waiting for Google Maps API (attempt ${attempts + 1}/${MAX_ATTEMPTS})`);
        attempts++;
        timeoutId = window.setTimeout(checkGoogleMapsLoaded, 100);
      } else {
        console.error('Google Maps failed to load after maximum attempts');
        setState((prev: AppState) => ({
          ...prev,
          error: 'Google Maps failed to load. Please check your internet connection and try again.',
          isDemoMode: true
        }));
      }
    }
    
    // Listen for the custom event from index.html
    const handleMapsReady = () => {
      console.log('Received google-maps-ready event');
      checkGoogleMapsLoaded();
    };

    const handleMapsError = (event: CustomEvent) => {
      console.error('Google Maps error:', event.detail);
      setState((prev: AppState) => ({
        ...prev,
        error: `Failed to load Google Maps: ${event.detail}`,
        isDemoMode: true
      }));
    };

    // Add event listeners
    window.addEventListener('google-maps-ready', handleMapsReady);
    window.addEventListener('google-maps-error', handleMapsError as EventListener);

    // Start initial check
    checkGoogleMapsLoaded();
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('google-maps-ready', handleMapsReady);
      window.removeEventListener('google-maps-error', handleMapsError as EventListener);
    };
  }, []);

  const handleLocationSelect = async (place: google.maps.places.PlaceResult) => {
    if (!place.geometry?.location) {
      setState((prev: AppState) => ({ ...prev, error: 'Invalid location selected' }));
      return;
    }

    const location = place.geometry.location;
    
    setState((prev: AppState) => ({
      ...prev,
      loading: true,
      error: null,
      searchLocation: location,
      mapCenter: {
        lat: location.lat(),
        lng: location.lng()
      }
    }));

    try {
      if (state.isDemoMode) {
        // Use demo data
        const demoHotels: Hotel[] = [
          {
            place_id: 'demo1',
            name: 'Grand Plaza Hotel',
            address: '123 Main Street, New York, NY',
            rating: 4.8,
            priceLevel: 4,
            geometry: {
              location: {
                lat: 40.7589,
                lng: -73.9851
              }
            },
            distance: 150,
            types: ['lodging'],
            vicinity: '123 Main Street'
          },
          {
            place_id: 'demo2',
            name: 'Luxury Suites & Spa',
            address: '456 Park Avenue, New York, NY',
            rating: 5.0,
            priceLevel: 5,
            geometry: {
              location: {
                lat: 40.7505,
                lng: -73.9934
              }
            },
            distance: 300,
            types: ['lodging'],
            vicinity: '456 Park Avenue'
          }
        ];
        setState((prev: AppState) => ({
          ...prev,
          loading: false,
          hotels: demoHotels
        }));
      } else {
        const response = await searchNearbyHotels(location);
        setState((prev: AppState) => ({
          ...prev,
          loading: false,
          hotels: response.hotels
        }));
      }
    } catch (error) {
      console.error('Search error:', error);
      setState((prev: AppState) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to search hotels'
      }));
    }
  };

  const handleSearch = async (params: SearchParams) => {
    setState((prev: AppState) => ({
      ...prev,
      loading: true,
      error: null,
      searchLocation: params.location,
      mapCenter: {
        lat: params.location.lat(),
        lng: params.location.lng()
      }
    }));

    try {
      const response = await fetch('/api/hotels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: params.location.lat(),
          longitude: params.location.lng(),
          checkIn: params.checkIn,
          checkOut: params.checkOut,
          guests: params.guests
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setState((prev: AppState) => ({
        ...prev,
        loading: false,
        hotels: data.hotels,
        searchMetadata: data.metadata
      }));

    } catch (err) {
      console.error('Search error:', err);
      setState((prev: AppState) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'An unexpected error occurred',
        hotels: [],
        searchMetadata: null
      }));
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-semibold text-gray-900">Hotel Search</h1>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <section className="mb-8">
            <SearchForm onSearch={handleSearch} isLoading={state.loading} />
            {state.error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700">{state.error}</p>
              </div>
            )}
          </section>

          {state.loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Searching for hotels...</p>
            </div>
          ) : (
            <>
              {state.hotels.length > 0 && (
                <section className="space-y-8">
                  <div 
                    className="relative bg-gray-100 rounded-lg overflow-hidden"
                    style={{ 
                      height: '500px',
                      width: '100%',
                      minHeight: '500px'
                    }}
                  >
                    {/* Debug info */}
                    {process.env.NODE_ENV === 'development' && (
                      <div className="absolute top-0 left-0 bg-white p-2 z-10 text-xs">
                        <pre>
                          {JSON.stringify({
                            center: state.mapCenter,
                            hotelsCount: state.hotels.length,
                            hasSearchLocation: !!state.searchLocation,
                            containerDimensions: {
                              width: mapRef.current?.offsetWidth,
                              height: mapRef.current?.offsetHeight
                            }
                          }, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    <Map
                      key={`${state.mapCenter.lat}-${state.mapCenter.lng}`}
                      center={state.mapCenter}
                      hotels={state.hotels}
                      searchLocation={state.searchLocation}
                    />
                  </div>
                  <div className="space-y-12">
                    <StarSection
                      rating={5}
                      hotels={filterHotels(state.hotels, 5)}
                      searchLocation={state.searchLocation}
                    />
                    <StarSection
                      rating={4}
                      hotels={filterHotels(state.hotels, 4)}
                      searchLocation={state.searchLocation}
                    />
                    <StarSection
                      rating={3}
                      hotels={filterHotels(state.hotels, 3)}
                      searchLocation={state.searchLocation}
                    />
                    <StarSection
                      rating={0}
                      hotels={getOtherHotels(state.hotels)}
                      searchLocation={state.searchLocation}
                    />
                  </div>
                </section>
              )}
            </>
          )}

          {/* Search Results */}
          {!state.loading && state.hotels.length > 0 && (
            <div className="space-y-6">
              {/* Search Metadata */}
              {state.searchMetadata && (
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <h2 className="text-lg font-medium text-gray-900 mb-2">Search Results</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Total Hotels</div>
                      <div className="text-2xl font-semibold text-gray-900">{state.searchMetadata.total}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Available</div>
                      <div className="text-2xl font-semibold text-green-600">{state.searchMetadata.available}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">With Pricing</div>
                      <div className="text-2xl font-semibold text-blue-600">{state.searchMetadata.withPricing}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Unavailable</div>
                      <div className="text-2xl font-semibold text-red-600">{state.searchMetadata.unavailable}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Results Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Map */}
                <div className="lg:col-span-1 h-[calc(100vh-20rem)] lg:sticky lg:top-6">
                  <Map
                    hotels={state.hotels}
                    searchLocation={state.searchLocation}
                    onHotelSelect={(hotel) => {
                      const element = document.getElementById(`hotel-${hotel.id}`);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        element.classList.add('highlight');
                        setTimeout(() => element.classList.remove('highlight'), 2000);
                      }
                    }}
                  />
                </div>

                {/* Hotel Grid */}
                <div className="lg:col-span-2">
                  <HotelGrid hotels={state.hotels} searchLocation={state.searchLocation} />
                </div>
              </div>
            </div>
          )}

          {/* No Results */}
          {!state.loading && !state.error && state.hotels.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hotels found
              </h3>
              <p className="text-gray-500">
                Try adjusting your search criteria or selecting a different location.
              </p>
            </div>
          )}

          {/* Demo Mode Notice */}
          <DemoMode />
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;