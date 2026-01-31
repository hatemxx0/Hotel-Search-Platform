import React from 'react';
import { HotelCard } from './HotelCard';
import { Hotel } from '../types/hotel';

interface HotelGridProps {
  hotels: Hotel[];
  searchLocation: google.maps.LatLng | null;
}

export const HotelGrid: React.FC<HotelGridProps> = ({ hotels, searchLocation }) => {
  if (hotels.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">🏨</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No hotels found</h3>
        <p className="text-gray-500">Try searching for a different location or adjusting your dates.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {hotels.map((hotel) => (
        <div key={hotel.id} id={`hotel-${hotel.id}`}>
          <HotelCard hotel={hotel} searchLocation={searchLocation} />
        </div>
      ))}
    </div>
  );
};