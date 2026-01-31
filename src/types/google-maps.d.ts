declare namespace google {
  namespace maps {
    class LatLng {
      constructor(lat: number, lng: number);
      lat(): number;
      lng(): number;
    }

    class LatLngBounds {
      constructor(sw?: LatLng, ne?: LatLng);
      extend(point: LatLng): LatLngBounds;
    }

    class Size {
      constructor(width: number, height: number);
    }

    class Point {
      constructor(x: number, y: number);
    }

    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    class Map {
      constructor(mapDiv: HTMLElement, opts?: MapOptions);
      setCenter(center: LatLng | LatLngLiteral): void;
      setZoom(zoom: number): void;
      fitBounds(bounds: LatLngBounds): void;
    }

    interface MapOptions {
      center?: LatLng | LatLngLiteral;
      zoom?: number;
      mapTypeId?: MapTypeId;
      styles?: MapTypeStyle[];
    }

    enum MapTypeId {
      ROADMAP = 'roadmap',
      SATELLITE = 'satellite',
      HYBRID = 'hybrid',
      TERRAIN = 'terrain'
    }

    interface MapTypeStyle {
      featureType?: string;
      elementType?: string;
      stylers?: any[];
    }

    class Marker {
      constructor(opts: MarkerOptions);
      setMap(map: Map | null): void;
      getPosition(): LatLng;
      addListener(event: string, handler: () => void): void;
    }

    interface MarkerOptions {
      position: LatLng | LatLngLiteral;
      map?: Map;
      title?: string;
      icon?: string | Icon;
    }

    interface Icon {
      url: string;
      scaledSize?: Size;
      anchor?: Point;
    }

    class InfoWindow {
      constructor(opts: InfoWindowOptions);
      open(map: Map, anchor?: Marker): void;
    }

    interface InfoWindowOptions {
      content: string;
    }

    namespace event {
      function clearInstanceListeners(instance: any): void;
    }

    namespace places {
      interface PlaceResult {
        place_id?: string;
        name?: string;
        vicinity?: string;
        rating?: number;
        price_level?: number;
        geometry?: {
          location?: LatLng;
        };
        photos?: PlacePhoto[];
        types?: string[];
      }

      interface PlacePhoto {
        getUrl(opts?: PhotoOptions): string;
        height?: number;
        width?: number;
      }

      interface PhotoOptions {
        maxWidth?: number;
        maxHeight?: number;
      }

      interface PlaceSearchRequest {
        location?: LatLng;
        radius?: number;
        type?: string;
        rankBy?: RankBy;
      }

      enum RankBy {
        DISTANCE = 'DISTANCE',
        PROMINENCE = 'PROMINENCE'
      }

      enum PlacesServiceStatus {
        OK = 'OK',
        ZERO_RESULTS = 'ZERO_RESULTS',
        OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
        REQUEST_DENIED = 'REQUEST_DENIED',
        INVALID_REQUEST = 'INVALID_REQUEST',
        UNKNOWN_ERROR = 'UNKNOWN_ERROR'
      }

      class PlacesService {
        constructor(attrContainer: HTMLElement);
        nearbySearch(
          request: PlaceSearchRequest,
          callback: (results: PlaceResult[] | null, status: PlacesServiceStatus) => void
        ): void;
      }

      class Autocomplete {
        constructor(
          input: HTMLInputElement,
          opts?: AutocompleteOptions
        );
        addListener(event: string, handler: () => void): void;
        getPlace(): PlaceResult;
      }

      class PlaceAutocompleteElement extends HTMLElement {
        constructor(opts?: AutocompleteOptions);
        addListener(event: string, handler: (event: any) => void): void;
      }

      interface AutocompleteOptions {
        types?: string[];
        componentRestrictions?: ComponentRestrictions;
      }

      interface ComponentRestrictions {
        country: string | string[];
      }
    }
  }
}

declare global {
  interface Window {
    google: typeof google;
  }
} 