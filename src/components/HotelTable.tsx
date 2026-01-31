import React from 'react';
import { Hotel } from '../types/hotel';

interface HotelTableProps {
  hotels: Hotel[];
  title: string;
  starRating?: number;
  className?: string;
}

const HotelTable: React.FC<HotelTableProps> = ({ hotels, title, className = '' }) => {
  if (hotels.length === 0) return null;

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Table Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700">
        <h2 className="text-xl font-semibold text-white flex items-center">
          {title}
          <span className="ml-3 bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
            {hotels.length} hotels
          </span>
        </h2>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hotel Details
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rating
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Distance
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {hotels.map((hotel) => (
              <tr key={hotel.place_id} className="hover:bg-gray-50 transition-colors">
                {/* Hotel Details */}
                <td className="px-6 py-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 flex-shrink-0 rounded-lg bg-gray-200 overflow-hidden">
                      {hotel.photos?.[0] ? (
                        <img
                          src={`https://maps.googleapis.com/maps/api/place/photo?maxwidth=100&photoreference=${hotel.photos[0].photo_reference}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`}
                          alt={hotel.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2zM9 7h6M9 11h6M9 15h6" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{hotel.name}</div>
                      <div className="text-sm text-gray-500 mt-1">{hotel.vicinity}</div>
                    </div>
                  </div>
                </td>

                {/* Rating */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, index) => (
                        <svg
                          key={index}
                          className={`w-4 h-4 ${
                            index < Math.floor(hotel.rating)
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">
                      {hotel.rating.toFixed(1)}
                    </span>
                  </div>
                </td>

                {/* Price */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {hotel.priceLevel ? (
                      <div className="flex items-center">
                        <span className="font-medium text-green-600">
                          €{(hotel.priceLevel * 50).toFixed(2)}
                        </span>
                        <span className="ml-2 text-gray-500">per night</span>
                      </div>
                    ) : (
                      <span className="text-gray-500">Price N/A</span>
                    )}
                  </div>
                </td>

                {/* Distance */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm">
                    {formatDistance(hotel.distance)}
                  </div>
                </td>

                {/* Actions */}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => window.open(`https://www.google.com/maps/place/?q=place_id:${hotel.place_id}`, '_blank')}
                      className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      View on Map
                    </button>
                    <button
                      onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(hotel.name)}&destination_place_id=${hotel.place_id}`, '_blank')}
                      className="text-green-600 hover:text-green-900 font-medium"
                    >
                      Get Directions
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Helper function to format distance
const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${meters}m away`;
  }
  const km = meters / 1000;
  if (km < 100) {
    return `${km.toFixed(1)}km away`;
  }
  // Convert to hours (assuming average speed of 60 km/h)
  const hours = km / 60;
  return `${hours.toFixed(1)} hours away`;
};

export default HotelTable; 