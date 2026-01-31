# 🌍 Travel Explorer - Hotel Search Website

A modern React-based travel website that helps users find nearby hotels using Google Maps APIs. Users can search for locations and view hotels grouped by star rating with distance calculations and interactive maps.

## ✨ Features

- **🔍 Smart Search**: Google Places Autocomplete for location input
- **🏨 Hotel Discovery**: Find hotels within 2km radius of any location
- **⭐ Star Rating Groups**: Hotels organized by 3, 4, and 5-star ratings
- **🗺️ Interactive Map**: Google Maps integration with custom markers
- **📏 Distance Calculation**: Real-time distance from search location
- **🎯 Sorting**: Hotels sorted by distance, rating, and price
- **📱 Responsive Design**: Mobile-friendly interface
- **⚡ Modern UI**: Clean, intuitive design with Tailwind CSS

## 🛠️ Tech Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Maps**: Google Maps JavaScript API
- **APIs**: Google Places API, Google Maps API
- **Build Tool**: Vite
- **State Management**: React Hooks

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- Google Maps API key with the following APIs enabled:
  - Maps JavaScript API
  - Places API
  - Geocoding API

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd travel-explorer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Google Maps API is already configured!** ✅
   
   The API key has been added to `index.html`. If you need to use a different key:
   
   Update the API key in `index.html`:
   ```html
   <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places"></script>
   ```
   
   Create a `.env` file in the root directory:
   ```env
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 📁 Project Structure

```
src/
├── components/
│   ├── SearchBar.tsx      # Location search with autocomplete
│   ├── Map.tsx           # Google Maps integration
│   ├── HotelCard.tsx     # Individual hotel display
│   └── StarSection.tsx   # Hotels grouped by rating
├── types/
│   ├── hotel.ts          # Hotel interface definitions
│   └── google-maps.d.ts  # Google Maps type declarations
├── utils/
│   └── api.ts           # Google Maps API utilities
├── App.tsx              # Main application component
└── main.tsx            # Application entry point
```

## 🔧 Configuration

### Google Maps API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Create credentials (API key)
5. Restrict the API key to your domain for security

### Environment Variables

Create a `.env` file with:
```env
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
```

## 🎯 Usage

1. **Search for a location**: Type an address, landmark, or area in the search bar
2. **Select from suggestions**: Choose from Google's autocomplete suggestions
3. **View results**: Hotels are displayed in groups by star rating
4. **Explore on map**: Click "View on Map" to see hotel locations
5. **Get directions**: Click "Get Directions" for navigation

## 🎨 Features in Detail

### Hotel Grouping
- **5-Star Hotels**: Premium accommodations
- **4-Star Hotels**: High-quality hotels
- **3-Star Hotels**: Standard accommodations

### Sorting Logic
1. **Distance**: Closest hotels first
2. **Rating**: Higher ratings preferred
3. **Price**: Lower price levels preferred

### Map Features
- Custom markers for each hotel
- Search location indicator
- Interactive info windows
- Automatic bounds fitting

## 🔒 Security Notes

- Never commit your API key to version control
- Use environment variables for sensitive data
- Restrict your Google Maps API key to specific domains
- Consider implementing rate limiting for production use

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel/Netlify
1. Connect your repository to Vercel or Netlify
2. Set environment variables in the deployment platform
3. Deploy automatically on push to main branch

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

1. **API Key Errors**: Ensure your Google Maps API key is valid and has the required APIs enabled
2. **CORS Issues**: Make sure your API key is restricted to the correct domain
3. **No Results**: Check if the location has hotels within the 2km radius
4. **Map Not Loading**: Verify the Google Maps script is loaded correctly

### Getting Help

- Check the browser console for error messages
- Verify your API key permissions
- Ensure all required APIs are enabled
- Check network connectivity

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section above
- Review Google Maps API documentation

---

**Happy Traveling! 🌍✈️**

# Hotel Search Platform

A modern hotel search platform that integrates with multiple providers to find the best hotel deals.

## Features

- 🏨 Real-time hotel search using Booking.com API
- 🗺️ Google Maps integration for location selection
- 💰 Live pricing and availability
- 📱 Responsive design
- 🚀 Fast and efficient with Redis caching
- ⚡ Fallback to Google Places API if needed

## Prerequisites

- Node.js 18+
- Redis server
- Booking.com API credentials
- Google Maps API key

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
NODE_ENV=development
PORT=3002
FRONTEND_URL=http://localhost:5173

# API Keys
GOOGLE_PLACES_API_KEY=your_google_places_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
GOOGLE_GEOCODING_API_KEY=your_google_geocoding_api_key

# Booking.com API Configuration
BOOKING_API_KEY=your_booking_api_key
BOOKING_AFFILIATE_ID=your_affiliate_id
BOOKING_CACHE_TTL=1800  # 30 minutes

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
CACHE_TTL=3600

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start Redis server:
   ```bash
   redis-server
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:5173 in your browser

## API Documentation

### Hotel Search Endpoint

`GET /api/hotels`

Query Parameters:
- `lat` (number): Latitude of the search location
- `lng` (number): Longitude of the search location
- `checkIn` (string): Check-in date (YYYY-MM-DD)
- `checkOut` (string): Check-out date (YYYY-MM-DD)
- `guests` (number): Number of guests

Example Response:
```json
{
  "success": true,
  "location": {
    "coordinates": { "lat": 40.7128, "lng": -74.0060 }
  },
  "hotels": [
    {
      "id": "booking_123456",
      "name": "Hotel Example",
      "address": "123 Main St, New York, NY",
      "rating": 4.5,
      "starRating": 4,
      "price": {
        "amount": 199.99,
        "currency": "USD",
        "period": "per night"
      },
      "photos": [
        {
          "url": "https://example.com/photo.jpg",
          "width": 800,
          "height": 600
        }
      ],
      "facilities": ["wifi", "pool", "spa"],
      "provider": "booking.com"
    }
  ],
  "metadata": {
    "total": 1,
    "provider": "booking.com",
    "fallback": false
  }
}
```

## Booking.com API Integration

This platform uses the Booking.com Demand API 3.1 for hotel search and pricing. To use this:

1. Register as a Booking.com affiliate partner
2. Get your API key and Affiliate ID
3. Add them to your environment variables
4. The system will automatically use Booking.com as the primary data source
5. If Booking.com API fails or returns no results, it falls back to Google Places API

### Rate Limiting and Caching

- Results are cached in Redis for 30 minutes by default
- API requests are rate-limited to protect against abuse
- Exponential backoff is implemented for retries
- Automatic fallback to Google Places if Booking.com API fails

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 