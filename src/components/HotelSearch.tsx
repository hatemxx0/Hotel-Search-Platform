import React, { useState } from 'react';
import { SearchForm } from './SearchForm';
import { HotelGrid } from './HotelGrid';
import { LoadingState } from './LoadingState';
import { ErrorMessage } from './ErrorMessage';
import { searchHotels } from '../services/api';

interface Hotel {
  id: string;
  name: string;
  address: string;
  starRating: number;
  image: string;
  price: {
    amount: number;
    currency: string;
    period: string;
  };
  amenities: string[];
  source: string;
}

interface SearchResults {
  hotels: Hotel[];
  location: {
    query: string;
    coordinates: { lat: number; lng: number };
  };
  total: number;
}

export function HotelSearch() {
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (searchParams: {
    location: string;
    checkIn: string;
    checkOut: string;
    guests: number;
  }) => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const data = await searchHotels(searchParams);
      setResults(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold text-gray-900">
          Find Your Perfect Hotel
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Search and compare hotels from top providers worldwide. 
          Get the best deals for your next stay.
        </p>
      </div>

      <SearchForm onSearch={handleSearch} loading={loading} />

      {loading && <LoadingState />}
      
      {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}
      
      {results && !loading && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-semibold text-gray-900">
              Hotels in {results.location.query}
            </h3>
            <p className="text-gray-600">
              Found {results.total} hotel{results.total !== 1 ? 's' : ''} available
            </p>
          </div>
          
          <HotelGrid hotels={results.hotels} />
        </div>
      )}
    </div>
  );
}