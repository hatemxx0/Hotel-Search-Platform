# 🏨 Hotel Search Platform - Complete System Documentation

## 📑 Table of Contents

1. [System Overview](#system-overview)
2. [What This System Does](#what-this-system-does)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [How APIs Work](#how-apis-work)
6. [API Endpoints Reference](#api-endpoints-reference)
7. [Services Architecture](#services-architecture)
8. [How to Add a New API](#how-to-add-a-new-api)
9. [Frontend Components](#frontend-components)
10. [Backend Services](#backend-services)
11. [Security Features](#security-features)
12. [Performance Features](#performance-features)
13. [Installation & Setup](#installation--setup)
14. [Environment Variables](#environment-variables)
15. [Running the Application](#running-the-application)
16. [Troubleshooting](#troubleshooting)

---

## 🎯 System Overview

**Hotel Search Platform** is a modern, full-stack web application that helps travelers find hotels near any location. It combines multiple data sources (Google Places, Google Maps, Booking.com) to provide comprehensive hotel information with real-time pricing, availability, and user reviews.

### Core Value Propositions:
- 🔍 **Smart Search** - Find hotels within 2km radius of any location
- 💰 **Real-time Pricing** - Get current rates from Booking.com
- ⭐ **Organized by Rating** - Hotels grouped into 3-star, 4-star, and 5-star categories
- 🗺️ **Interactive Maps** - Visual location display with custom markers
- 📏 **Distance Calculation** - Precise distance from search location to each hotel
- 📱 **Responsive Design** - Works seamlessly on mobile and desktop

---

## 📊 What This System Does

### User Journey:
1. User enters a location or city name in the search bar
2. Google Places Autocomplete suggests matching locations
3. User selects a location and enters check-in/check-out dates, guest count
4. System geocodes the location to get coordinates
5. Backend searches for hotels within 50km radius using Google Places API
6. Results are enriched with pricing from Booking.com API
7. Hotels are displayed in three categories by star rating
8. User can view details, see location on map, and access reviews
9. All results are cached in Redis for fast retrieval

### Key Features:
- **Search Hotels** by location, dates, and guest count
- **View Hotel Details** including ratings, prices, and photos
- **Interactive Map** showing hotel locations with markers
- **Hotel Reviews** from Google Places with user ratings
- **Distance Calculation** using Haversine formula
- **Autocomplete Suggestions** for location input
- **Rate Limiting** to protect APIs from overuse
- **Caching** for improved performance
- **Metrics Tracking** for monitoring API usage

---

## 🛠️ Technology Stack

### Frontend
| Technology | Purpose | Version |
|------------|---------|---------|
| **React** | UI Library | 18.2.0 |
| **TypeScript** | Type Safety | 5.3.3 |
| **Vite** | Build Tool | 5.0.12 |
| **Tailwind CSS** | Styling | 3.4.1 |
| **Lucide React** | Icons | 0.344.0 |
| **Google Maps API** | Map Display | Latest |

### Backend
| Technology | Purpose | Version |
|------------|---------|---------|
| **Node.js** | Runtime | v16+ |
| **Express** | Web Framework | 4.18.2 |
| **Redis** | Caching & Sessions | 4.6.10 |
| **Axios** | HTTP Client | 1.6.2 |
| **Helmet** | Security Headers | 7.1.0 |
| **Morgan** | Request Logging | 1.10.0 |
| **Express Rate Limit** | Rate Limiting | 7.1.5 |
| **Compression** | Response Compression | 1.7.4 |

### External APIs
- **Google Maps JavaScript API** - Map rendering
- **Google Places API** - Hotel search and autocomplete
- **Google Geocoding API** - Address to coordinates conversion
- **Google Places Details API** - Hotel details and reviews
- **Booking.com API** - Pricing and availability

---

## 📁 Project Structure

```
hotel-search-platform/
├── src/                              # Frontend (React/TypeScript)
│   ├── components/
│   │   ├── DemoMode.tsx             # Demo mode toggle
│   │   ├── ErrorBoundary.tsx        # Error handling wrapper
│   │   ├── ErrorMessage.tsx         # Error display component
│   │   ├── Footer.tsx               # Footer component
│   │   ├── Header.tsx               # Header component
│   │   ├── HotelCard.tsx            # Hotel card display
│   │   ├── HotelGrid.tsx            # Grid layout for hotels
│   │   ├── HotelSearch.tsx          # Search interface
│   │   ├── HotelTable.tsx           # Table view of hotels
│   │   ├── LoadingState.tsx         # Loading indicator
│   │   ├── Map.tsx                  # Google Map component
│   │   ├── SearchBar.tsx            # Location search input
│   │   ├── SearchForm.tsx           # Complete search form
│   │   ├── StarSection.tsx          # Hotels grouped by rating
│   │   └── ReviewsPanel.tsx         # Hotel reviews display (NEW)
│   ├── services/
│   │   └── api.ts                   # API calls to backend
│   ├── types/
│   │   ├── google-maps.d.ts         # Google Maps types
│   │   └── hotel.ts                 # TypeScript interfaces
│   ├── utils/
│   │   └── api.ts                   # API utility functions
│   ├── App.tsx                      # Main app component
│   ├── main.tsx                     # Entry point
│   ├── config.ts                    # Frontend config
│   ├── index.css                    # Global styles
│   └── vite-env.d.ts                # Vite environment types
│
├── server/                           # Backend (Node.js/Express)
│   ├── services/
│   │   ├── hotelService.js          # Hotel search logic
│   │   ├── geocodingService.js      # Location geocoding
│   │   ├── bookingService.js        # Booking.com integration
│   │   ├── metricsService.js        # API metrics tracking
│   │   └── reviewService.js         # Review fetching (NEW)
│   ├── middleware/
│   │   ├── errorHandler.js          # Error handling middleware
│   │   └── validation.js            # Request validation
│   ├── config/
│   │   ├── index.js                 # Configuration loader
│   │   └── redis.js                 # Redis connection setup
│   └── index.js                     # Express server & routes
│
├── deployment/                       # Deployment files
│   ├── deploy.sh                    # Deployment script
│   ├── setup-server.sh              # Server setup script
│   ├── ecosystem.config.js          # PM2 config
│   ├── nginx.conf                   # Nginx configuration
│   └── proxy_params                 # Nginx proxy settings
│
├── package.json                     # Dependencies
├── vite.config.ts                   # Vite configuration
├── tailwind.config.js               # Tailwind CSS config
├── tsconfig.json                    # TypeScript config
├── README.md                        # Quick start guide
├── API_INTEGRATION.md               # API integration details
├── PRODUCTION_SETUP.md              # Production setup guide
└── PRODUCTION_DEPLOYMENT.md         # Deployment guide
```

---

## 🔗 How APIs Work

### System Architecture Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                              │
│                   (React Application)                            │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                HTTP Requests/Responses
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│              EXPRESS SERVER (Port 3002)                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Routes & Middleware                                     │    │
│  │ • Error Handler                                         │    │
│  │ • Rate Limiter (100 req/15min)                         │    │
│  │ • CORS Handler                                          │    │
│  │ • Morgan Logger                                         │    │
│  │ • Helmet Security                                       │    │
│  └─────────────────────────────────────────────────────────┘    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
   ┌─────────┐        ┌─────────┐      ┌──────────┐
   │  Redis  │        │ Services│      │ External │
   │ (Cache) │        │ Layer   │      │  APIs    │
   └─────────┘        └────┬────┘      └──────────┘
                           │                  │
        ┌──────────────────┼──────────────────┘
        │                  │
        ├──► Hotel Service
        │    ├─► Google Places API
        │    └─► Booking.com API
        │
        ├──► Geocoding Service
        │    └─► Google Geocoding API
        │
        ├──► Review Service (NEW)
        │    └─► Google Places Details API
        │
        └──► Metrics Service
             └─► Tracking & Analytics
```

### Request/Response Cycle

```
1. Frontend (React)
   ↓
2. HTTP Request to Backend
   ├─ Check Rate Limit
   ├─ Validate Input
   └─ Log Request (Morgan)
   ↓
3. Route Handler
   ├─ Check Redis Cache
   ├─ If miss → Call External API
   ├─ Store in Redis Cache
   └─ Track Metrics
   ↓
4. HTTP Response
   ├─ JSON Data
   ├─ Status Code
   └─ Headers
   ↓
5. Frontend Process
   ├─ Parse JSON
   ├─ Update State
   ├─ Render UI
   └─ Display to User
```

---

## 📡 API Endpoints Reference

### Hotel Search
**Endpoint:** `GET /api/hotels`

**Purpose:** Search for hotels near coordinates

**Query Parameters:**
```
lat      (required) - Latitude
lng      (required) - Longitude
checkIn  (optional) - Check-in date (YYYY-MM-DD)
checkOut (optional) - Check-out date (YYYY-MM-DD)
guests   (optional) - Number of guests (1-10)
```

**Example Request:**
```bash
GET /api/hotels?lat=40.7128&lng=-74.0060&checkIn=2024-02-15&checkOut=2024-02-16&guests=2
```

**Response:**
```json
{
  "success": true,
  "location": {
    "coordinates": { "lat": 40.7128, "lng": -74.0060 }
  },
  "hotels": [
    {
      "id": "place_id_123",
      "name": "Hotel Name",
      "address": "123 Main St, City",
      "rating": 4.5,
      "latitude": 40.7138,
      "longitude": -74.0070,
      "distance": 1200,
      "price": { "amount": 150, "currency": "EUR" },
      "photos": [...],
      "available": true
    }
  ],
  "total": 25,
  "timestamp": "2024-02-10T15:30:00.000Z"
}
```

---

### Places Autocomplete
**Endpoint:** `GET /api/places/autocomplete`

**Purpose:** Get location suggestions as user types

**Query Parameters:**
```
input (required) - Search text (min 2 characters)
```

**Example Request:**
```bash
GET /api/places/autocomplete?input=new york
```

**Response:**
```json
{
  "predictions": [
    {
      "description": "New York, NY, USA",
      "place_id": "ChIJOwg_06VPwokR4/KR_vVj_Qk",
      "structured_formatting": {
        "main_text": "New York",
        "secondary_text": "NY, USA"
      }
    }
  ]
}
```

---

### Hotel Reviews
**Endpoint:** `GET /api/reviews/:placeId`

**Purpose:** Fetch reviews for a specific hotel

**Path Parameters:**
```
placeId (required) - Google Places ID of the hotel
```

**Example Request:**
```bash
GET /api/reviews/ChIJ_W-FqFGbkIARN-Wvb8-EwgY
```

**Response:**
```json
{
  "success": true,
  "placeId": "ChIJ_W-FqFGbkIARN-Wvb8-EwgY",
  "reviews": [
    {
      "author": "John Doe",
      "rating": 5,
      "text": "Amazing hotel, great location!",
      "relative_time_description": "2 weeks ago"
    }
  ],
  "total": 45,
  "averageRating": 4.7,
  "timestamp": "2024-02-10T15:30:00.000Z"
}
```

---

### Health Check
**Endpoint:** `GET /health`

**Purpose:** Check server and Redis status

**Response:**
```json
{
  "status": "OK",
  "redis": "connected",
  "uptime": 3600,
  "memory": {...}
}
```

---

### Metrics
**Endpoint:** `GET /api/metrics`

**Purpose:** Get API usage statistics (requires `ENABLE_METRICS=true`)

**Response:**
```json
{
  "total_requests": 1250,
  "total_api_calls": 450,
  "cache_hits": 320,
  "cache_misses": 130,
  "timestamp": "2024-02-10T15:30:00.000Z"
}
```

---

## 🏗️ Services Architecture

### 1. Hotel Service (`hotelService.js`)

**Responsibilities:**
- Search hotels using Google Places API
- Enrich results with Booking.com pricing
- Calculate distance between locations
- Filter hotels by availability
- Sort results by price, rating, distance

**Key Functions:**
```javascript
searchHotels({ latitude, longitude, checkIn, checkOut, guests })
enrichHotelsWithPricing(hotels, bookingParams)
calculateHotelDistance(lat1, lng1, lat2, lng2)
```

**External Dependencies:**
- Google Places API (hotel search)
- Booking.com API (pricing)
- Redis (caching)

---

### 2. Geocoding Service (`geocodingService.js`)

**Responsibilities:**
- Convert addresses to coordinates
- Handle location ambiguity
- Cache geocoding results
- Retry on API rate limits

**Key Functions:**
```javascript
geocodeLocation(location)
callGoogleGeocodingAPI(location)
```

**Caching Strategy:**
- TTL: 24 hours
- Key: `geocode:{normalized_location}`

---

### 3. Review Service (`reviewService.js`)

**Responsibilities:**
- Fetch hotel reviews from Google Places
- Calculate average ratings
- Handle API retries
- Cache review data

**Key Functions:**
```javascript
getHotelReviews(placeId)
fetchFromGooglePlaces(placeId)
calculateAverageRating(reviews)
```

**Caching Strategy:**
- TTL: 12 hours
- Key: `reviews:{placeId}`

---

### 4. Booking Service (`bookingService.js`)

**Responsibilities:**
- Fetch pricing from Booking.com
- Get availability information
- Handle date formatting
- Map hotel IDs between providers

**Key Functions:**
```javascript
searchHotelsWithPricing(hotels, bookingParams)
getHotelDetails(hotelId)
```

---

### 5. Metrics Service (`metricsService.js`)

**Responsibilities:**
- Track API call counts
- Monitor cache performance
- Calculate success/failure rates
- Provide analytics data

**Key Functions:**
```javascript
trackAPICall(apiName, asyncFunction)
getMetrics()
resetMetrics()
```

---

## 🆕 How to Add a New API (Complete Step-by-Step Guide)

### Overview
Adding a new API follows this 5-step pattern:
1. Create a Service file
2. Add Backend Endpoint
3. Create Frontend API function
4. Create React Component
5. Integrate into App

### Example: Adding a "Reviews" API

---

### **Step 1: Create Service File**

**File:** `server/services/reviewService.js`

```javascript
import { setCache, getCache } from '../config/redis.js';
import { trackAPICall } from './metricsService.js';
import fetch from 'node-fetch';

class ReviewError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = 'ReviewError';
    this.status = status;
  }
}

/**
 * Fetch reviews for a hotel
 * @param {string} placeId - Google Places ID
 * @returns {Promise<Array>} Array of reviews
 */
export async function getHotelReviews(placeId) {
  if (!placeId || typeof placeId !== 'string') {
    throw new ReviewError('Invalid place ID provided', 400);
  }

  const cacheKey = `reviews:${placeId}`;

  try {
    // Check Redis cache
    const cached = await getCache(cacheKey);
    if (cached) {
      console.log(`⭐ Cache hit for: ${placeId}`);
      return cached;
    }

    // Fetch from API
    const reviews = await trackAPICall('google_places_reviews', async () => {
      return await fetchFromGooglePlaces(placeId);
    });

    // Cache for 12 hours
    if (reviews && reviews.length > 0) {
      await setCache(cacheKey, reviews, 43200);
    }

    return reviews || [];

  } catch (error) {
    console.error(`Error fetching reviews:`, error.message);
    throw error instanceof ReviewError ? error : 
          new ReviewError('Failed to fetch reviews');
  }
}

async function fetchFromGooglePlaces(placeId) {
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    throw new ReviewError('API key not configured');
  }

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating&key=${process.env.GOOGLE_PLACES_API_KEY}`;

  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' },
    timeout: 10000
  });

  if (!response.ok) {
    throw new ReviewError(`API error: ${response.status}`, response.status);
  }

  const data = await response.json();
  if (data.status === 'OK' && data.result) {
    return data.result.reviews || [];
  }

  return [];
}

export function calculateAverageRating(reviews) {
  if (!reviews || reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}
```

---

### **Step 2: Add Backend Endpoint**

**File:** `server/index.js`

Add import:
```javascript
import { getHotelReviews, calculateAverageRating } from './services/reviewService.js';
```

Add endpoint (before error handler):
```javascript
app.get('/api/reviews/:placeId', async (req, res) => {
  try {
    const { placeId } = req.params;
    
    if (!placeId) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Place ID is required'
      });
    }

    console.log(`⭐ Fetching reviews for: ${placeId}`);
    
    const reviews = await getHotelReviews(placeId);

    res.json({
      success: true,
      placeId,
      reviews,
      total: reviews.length,
      averageRating: calculateAverageRating(reviews),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Reviews error:', error);
    
    if (error.name === 'ReviewError') {
      return res.status(error.status || 500).json({
        error: 'Review fetch failed',
        message: error.message
      });
    }
    
    res.status(500).json({
      error: 'Review fetch failed',
      message: 'An unexpected error occurred.'
    });
  }
});
```

---

### **Step 3: Create Frontend API Function**

**File:** `src/utils/api.ts`

```typescript
/**
 * Fetch hotel reviews
 * @param placeId - Google Places ID
 * @returns Promise with reviews data
 */
export const fetchHotelReviews = async (placeId: string) => {
  try {
    if (!placeId) {
      throw new Error('Place ID is required');
    }

    const response = await fetch(
      `${API_BASE_URL}/api/reviews/${encodeURIComponent(placeId)}`
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message || 
        `Failed to fetch reviews: ${response.status}`
      );
    }

    const data = await response.json();
    console.log(`📖 Fetched ${data.total} reviews`);
    
    return data;
  } catch (error) {
    console.error('Error fetching reviews:', error);
    throw error;
  }
};
```

---

### **Step 4: Create React Component**

**File:** `src/components/ReviewsPanel.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { fetchHotelReviews } from '../utils/api';
import { LoadingState } from './LoadingState';
import { ErrorMessage } from './ErrorMessage';

interface ReviewsProps {
  placeId: string;
  hotelName: string;
}

export const ReviewsPanel: React.FC<ReviewsProps> = ({ placeId, hotelName }) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    const loadReviews = async () => {
      if (!placeId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const data = await fetchHotelReviews(placeId);
        setReviews(data.reviews);
        setAverageRating(data.averageRating);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, [placeId]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="reviews-panel p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{hotelName} Reviews</h3>
        <div className="flex items-center gap-2">
          <span className="text-yellow-500">⭐</span>
          <span className="font-bold">{averageRating}</span>
          <span className="text-gray-500">({reviews.length})</span>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-gray-500">No reviews available.</p>
        ) : (
          reviews.slice(0, 5).map((review, idx) => (
            <div key={idx} className="bg-white p-3 rounded border">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-sm">{review.author}</p>
                  <p className="text-xs text-gray-500">
                    {review.relative_time_description}
                  </p>
                </div>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span 
                      key={i} 
                      className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-700">{review.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
```

---

### **Step 5: Use in App Component**

**File:** `src/App.tsx`

Import the component:
```typescript
import { ReviewsPanel } from './components/ReviewsPanel';
```

Use in JSX:
```typescript
<ReviewsPanel 
  placeId={hotel.googleData.place_id} 
  hotelName={hotel.name} 
/>
```

---

## 🎨 Frontend Components

### Component Hierarchy

```
App (Main Container)
├── Header
├── SearchForm
│   ├── SearchBar
│   └── Date/Guest Inputs
├── LoadingState
├── ErrorMessage
├── Map
├── StarSection (Container for each rating group)
│   └── HotelGrid or HotelTable
│       └── HotelCard
│           ├── Hotel Info
│           ├── Photo Gallery
│           ├── Distance & Price
│           └── ReviewsPanel (NEW)
├── DemoMode
└── Footer
```

### Key Components

**SearchForm.tsx** - Main search interface
- Location input with autocomplete
- Check-in/check-out date pickers
- Guest count selector
- Search button

**HotelCard.tsx** - Individual hotel display
- Hotel name and address
- Star rating
- Price
- Distance from search location
- Photo carousel
- Action buttons (View, Directions, Reviews)

**Map.tsx** - Google Maps display
- Center on search location
- Hotel markers with custom icons
- Infowindows for hotel details
- Interactive controls

**ReviewsPanel.tsx** - Hotel reviews display (NEW)
- Review cards with author and rating
- Average rating display
- Review count
- Chronological order

---

## 🔧 Backend Services

### Middleware Stack

```
Helmet Security Headers
    ↓
Compression
    ↓
Morgan Logger
    ↓
CORS Handler
    ↓
Body Parser (JSON/URL)
    ↓
Rate Limiter
    ↓
Route Handler
    ↓
Error Handler
```

### Service Layer Pattern

Each service follows this pattern:

```javascript
// 1. Custom Error Class
class ServiceError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// 2. Main Function with Caching
export async function mainFunction(params) {
  const cacheKey = `service:${params}`;
  
  // Check cache
  const cached = await getCache(cacheKey);
  if (cached) return cached;
  
  // Track API call
  const result = await trackAPICall('api_name', async () => {
    return await externalAPICall(params);
  });
  
  // Store cache
  await setCache(cacheKey, result, ttlSeconds);
  
  return result;
}

// 3. API Call Function
async function externalAPICall(params) {
  const response = await fetch(url);
  if (!response.ok) throw new ServiceError(message, status);
  
  const data = await response.json();
  return parseData(data);
}
```

---

## 🔐 Security Features

### 1. Helmet Security Headers
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://maps.googleapis.com"]
    }
  }
}));
```

**Protects against:**
- XSS (Cross-Site Scripting)
- Clickjacking
- MIME type sniffing
- Weak SSL/TLS

### 2. CORS Configuration
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS']
}));
```

### 3. Rate Limiting
```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // Max 100 requests
  message: 'Too many requests'
});
app.use('/api/', limiter);
```

**Prevents:**
- Brute force attacks
- DDoS attacks
- API abuse

### 4. Input Validation
```javascript
export function validateSearchQuery(req, res, next) {
  const { lat, lng } = req.query;
  
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({
      error: 'Invalid coordinates'
    });
  }
  
  next();
}
```

### 5. Environment Variables
Sensitive data stored in `.env`:
```
GOOGLE_PLACES_API_KEY=xxx
GOOGLE_GEOCODING_API_KEY=xxx
BOOKING_COM_API_KEY=xxx
REDIS_URL=redis://localhost:6379
NODE_ENV=production
```

---

## ⚡ Performance Features

### 1. Redis Caching Strategy

**Cache Keys:**
```
geocode:{location}           → TTL: 24 hours
reviews:{placeId}            → TTL: 12 hours
hotels:search:{lat},{lng}    → TTL: 1 hour
```

**Cache Hit Benefits:**
- Reduced API calls by 60-80%
- Faster response times (Redis vs external APIs)
- Lower costs (fewer API calls)
- Better user experience

### 2. Response Compression
```javascript
app.use(compression());
```
- Gzip compression on responses
- Reduces payload size by 70-80%
- Faster network transmission

### 3. Connection Pooling
- Redis connection reused across requests
- HTTP keep-alive for external APIs
- Prevents connection exhaustion

### 4. Pagination (for future)
```javascript
// Can add ?limit=20&offset=0 to hotels endpoint
const limit = parseInt(req.query.limit) || 20;
const offset = parseInt(req.query.offset) || 0;
const hotels = allHotels.slice(offset, offset + limit);
```

### 5. Request Logging
```javascript
app.use(morgan('combined'));
```
- Tracks request times
- Identifies slow endpoints
- Helps with debugging

---

## 📦 Installation & Setup

### Prerequisites
- Node.js v16 or higher
- npm or yarn
- Redis (local or remote)
- Google Maps API Keys (Places, Geocoding, Maps JavaScript)

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd hotel-search-platform
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Set Up Environment Variables
Create `.env` file in root:
```env
# Frontend
VITE_API_BASE_URL=http://localhost:3002

# Backend
NODE_ENV=development
PORT=3002
FRONTEND_URL=http://localhost:5173

# Google APIs
GOOGLE_PLACES_API_KEY=your_key_here
GOOGLE_GEOCODING_API_KEY=your_key_here

# Booking.com
BOOKING_COM_API_KEY=your_key_here

# Redis
REDIS_URL=redis://localhost:6379

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Metrics
ENABLE_METRICS=true
```

### Step 4: Get Google Maps API Keys
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project
3. Enable APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Create API key (restrict to your domain)
5. Copy keys to `.env`

### Step 5: Set Up Redis
**Option A: Local**
```bash
# Install Redis
brew install redis  # macOS
# or
choco install redis  # Windows

# Start Redis
redis-server
```

**Option B: Docker**
```bash
docker run -d -p 6379:6379 redis:latest
```

---

## 🚀 Running the Application

### Development Mode
Runs both frontend and backend concurrently:
```bash
npm run dev
```

Outputs:
- Frontend: http://localhost:5173
- Backend: http://localhost:3002

### Backend Only
```bash
npm run server
```

### Frontend Only
```bash
npm run build
npm run preview
```

### Production Mode
```bash
npm run start
```

---

## 🔍 Troubleshooting

### Issue: "Cannot find Google Maps API key"
**Solution:**
- Check `.env` file has `GOOGLE_PLACES_API_KEY`
- Verify key is valid in Google Cloud Console
- Check API is enabled for your project

### Issue: "Redis connection failed"
**Solution:**
- Ensure Redis is running: `redis-cli ping` should return "PONG"
- Check `REDIS_URL` in `.env`
- If using Docker: `docker ps` to verify container

### Issue: "CORS error" in browser
**Solution:**
- Check `FRONTEND_URL` in `.env` matches actual frontend URL
- Ensure backend is running on correct port
- Clear browser cache

### Issue: "Rate limit exceeded"
**Solution:**
- Wait 15 minutes (default window)
- Change `RATE_LIMIT_WINDOW_MS` or `RATE_LIMIT_MAX_REQUESTS`
- Use different IP address

### Issue: "Hotel search returns no results"
**Solution:**
- Check coordinates are valid (lat: -90 to 90, lng: -180 to 180)
- Check Google Places API is enabled
- Check API key has Places API enabled
- Try city name with autocomplete first

### Issue: "Slow response times"
**Solution:**
- Check Redis cache is working: `redis-cli`
- Monitor metrics: `GET /api/metrics`
- Check network latency to external APIs
- Consider caching more aggressively

---

## 📊 Monitoring & Metrics

### View Metrics
```bash
curl http://localhost:3002/api/metrics
```

### Response:
```json
{
  "total_requests": 1250,
  "total_api_calls": 450,
  "cache_hits": 320,
  "cache_misses": 130,
  "success_rate": 99.2,
  "avg_response_time": 145,
  "timestamp": "2024-02-10T15:30:00.000Z"
}
```

### Key Metrics:
- **Cache Hit Rate** - Should be > 60%
- **Success Rate** - Should be > 99%
- **Avg Response Time** - Should be < 500ms
- **Total Requests** - Monitor for unusual spikes

---

## 🤝 Contributing

### Code Style
- Use TypeScript for frontend
- Use JavaScript ES6+ for backend
- Follow existing naming conventions
- Add JSDoc comments for functions

### Adding Features
1. Create feature branch: `git checkout -b feature/my-feature`
2. Follow the API addition pattern above
3. Test thoroughly
4. Submit pull request

### Testing
```bash
npm run lint     # Check code style
npm run build    # Build for production
npm run preview  # Test production build
```

---

## 📝 License

This project is licensed under the MIT License.

---

## 📧 Support

For issues and questions:
- Check [Troubleshooting](#troubleshooting) section
- Review API documentation above
- Check server logs for errors
- Enable metrics for debugging

---

**Last Updated:** January 2024
**System Version:** 1.0.0
**Maintainer:** Development Team
