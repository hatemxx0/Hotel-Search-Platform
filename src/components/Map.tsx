import React, { useEffect, useRef, useState } from 'react';
import { Hotel } from '../types/hotel';

interface MapProps {
  hotels: Hotel[];
  searchLocation: google.maps.LatLng | null;
  onHotelSelect?: (hotel: Hotel) => void;
}

export const Map: React.FC<MapProps> = ({ hotels, searchLocation, onHotelSelect }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    const initialCenter = searchLocation || new google.maps.LatLng(40.7128, -74.0060);
    const newMap = new google.maps.Map(mapRef.current, {
      center: initialCenter,
      zoom: 13,
      disableDefaultUI: true,
      zoomControl: true,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    setMap(newMap);
    setInfoWindow(new google.maps.InfoWindow({ content: '' }));

    return () => {
      setMap(null);
      setInfoWindow(null);
    };
  }, []);

  // Update markers when hotels change
  useEffect(() => {
    if (!map || !infoWindow) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));

    // Create new markers
    const newMarkers = hotels.map((hotel, index) => {
      const marker = new google.maps.Marker({
        position: { lat: hotel.latitude, lng: hotel.longitude },
        map,
        title: hotel.name,
        label: {
          text: `${index + 1}`,
          color: 'white',
          fontSize: '14px'
        },
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="${hotel.available ? '#3B82F6' : '#9CA3AF'}" stroke="white" stroke-width="2"/>
            </svg>
          `)}`,
          scaledSize: new google.maps.Size(24, 24),
          anchor: new google.maps.Point(12, 12)
        }
      });

      marker.addListener('click', () => {
        const content = `
          <div class="p-2 max-w-xs">
            <h3 class="font-medium text-gray-900">${hotel.name}</h3>
            <p class="text-sm text-gray-600">${hotel.address}</p>
            ${hotel.price ? `
              <p class="mt-1 text-sm font-medium text-green-600">
                ${new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: hotel.price.currency
                }).format(hotel.price.amount)}
                <span class="text-gray-500 font-normal">/ ${hotel.price.period}</span>
              </p>
            ` : ''}
            ${hotel.available ? `
              <p class="text-sm text-green-600 mt-1">Available</p>
            ` : `
              <p class="text-sm text-red-600 mt-1">Not Available</p>
            `}
          </div>
        `;
        
        infoWindow.setContent(content);
        infoWindow.open({
          map,
          anchor: marker
        });
        
        if (onHotelSelect) {
          onHotelSelect(hotel);
        }
      });

      return marker;
    });

    setMarkers(newMarkers);

    // Fit bounds to include all markers and search location
    const bounds = new google.maps.LatLngBounds();
    newMarkers.forEach(marker => bounds.extend(marker.getPosition()!));
    if (searchLocation) {
      bounds.extend(searchLocation);
      
      // Add search location marker
      new google.maps.Marker({
        position: searchLocation,
        map,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
              <circle cx="8" cy="8" r="6" fill="#EF4444" stroke="white" stroke-width="2"/>
            </svg>
          `)}`,
          scaledSize: new google.maps.Size(16, 16),
          anchor: new google.maps.Point(8, 8)
        },
        zIndex: 1000
      });
    }

    // Add padding to bounds
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const latPadding = (ne.lat() - sw.lat()) * 0.1;
    const lngPadding = (ne.lng() - sw.lng()) * 0.1;
    bounds.extend(new google.maps.LatLng(ne.lat() + latPadding, ne.lng() + lngPadding));
    bounds.extend(new google.maps.LatLng(sw.lat() - latPadding, sw.lng() - lngPadding));
    
    map.fitBounds(bounds);

    return () => {
      newMarkers.forEach(marker => marker.setMap(null));
    };
  }, [map, hotels, searchLocation, infoWindow]);

  return (
    <div className="w-full h-full rounded-lg overflow-hidden shadow-md bg-white">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}; 