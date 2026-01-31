import React from 'react';
import { Star, MapPin, Wifi, Car, ExternalLink, AlertCircle } from 'lucide-react';

interface HotelCardProps {
  hotel: {
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
  };
  searchLocation: google.maps.LatLng | null;
}

export const HotelCard: React.FC<HotelCardProps> = ({ hotel, searchLocation }) => {
  const {
    name,
    address,
    rating,
    photos,
    price,
    available,
    facilities,
    bookingUrl,
    provider,
    error
  } = hotel;

  // Get photo URL based on provider
  const getPhotoUrl = () => {
    if (!photos || photos.length === 0) {
      return '/placeholder-hotel.jpg';
    }

    if (provider === 'google' && photos[0].photo_reference) {
      return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photos[0].photo_reference}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`;
    }

    return photos[0].url || '/placeholder-hotel.jpg';
  };

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-200 hover:shadow-lg border ${
      available ? 'border-gray-200' : 'border-gray-300 opacity-75'
    }`}>
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={getPhotoUrl()}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder-hotel.jpg';
          }}
        />
        {provider === 'booking.com' && (
          <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
            Booking.com
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Hotel Name and Rating */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 flex-1">{name}</h3>
          {rating > 0 && (
            <div className="flex items-center bg-blue-50 px-2 py-1 rounded">
              <Star className="w-4 h-4 text-yellow-400 mr-1" />
              <span className="text-sm font-medium text-gray-900">{rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Address */}
        <div className="flex items-start text-gray-600 mb-4">
          <MapPin className="w-4 h-4 mt-1 mr-1 flex-shrink-0" />
          <span className="text-sm">{address}</span>
        </div>

        {/* Facilities */}
        {facilities && facilities.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {facilities.slice(0, 3).map((facility, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
              >
                {facility}
              </span>
            ))}
            {facilities.length > 3 && (
              <span className="text-xs text-gray-500">
                +{facilities.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Availability and Price */}
        <div className="mt-4 flex items-center justify-between">
          <div>
            {error ? (
              <div className="flex items-center text-orange-600">
                <AlertCircle className="w-4 h-4 mr-1" />
                <span className="text-sm">{error}</span>
              </div>
            ) : available ? (
              <div className="text-green-600 font-medium">Available</div>
            ) : (
              <div className="text-red-600 font-medium">Not Available</div>
            )}
          </div>
          
          {price && available && (
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: price.currency
                }).format(price.amount)}
              </div>
              <div className="text-sm text-gray-600">{price.period}</div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex gap-2">
          {bookingUrl && available && (
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              Book Now
              <ExternalLink className="w-4 h-4 ml-1" />
            </a>
          )}
          {searchLocation && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&origin=${searchLocation.lat()},${searchLocation.lng()}&destination=${hotel.latitude},${hotel.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
            >
              Directions
              <MapPin className="w-4 h-4 ml-1" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};