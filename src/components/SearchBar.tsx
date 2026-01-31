import React, { useEffect, useRef, useState } from 'react';

interface SearchBarProps {
  onLocationSelect: (place: google.maps.places.PlaceResult) => void;
}

declare global {
  interface Window {
    google: typeof google;
  }
}

const SearchBar = ({ onLocationSelect }: SearchBarProps): JSX.Element => {
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!inputRef.current || !window.google) return;

    try {
      // Initialize the Autocomplete object
      const options: google.maps.places.AutocompleteOptions = {
        types: ['geocode'], // This restricts the search to geographical locations
      };

      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, options);

      // Add the place_changed event listener
      autocompleteRef.current.addListener('place_changed', () => {
        if (!autocompleteRef.current) return;

        const place = autocompleteRef.current.getPlace();

        if (!place.geometry || !place.geometry.location) {
          setError('No location data available for this place');
          return;
        }

        // Clear any previous errors
        setError(null);
        
        // Call the callback with the selected place
        onLocationSelect(place);
      });
    } catch (error) {
      console.error('Error initializing autocomplete:', error);
      setError('Failed to initialize search. Please try again.');
    }

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onLocationSelect]);

  return (
    <div className="relative w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search for a location..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
};

export default SearchBar; 