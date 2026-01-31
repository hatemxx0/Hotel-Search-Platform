require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3002,
  googleApiKey: 'AIzaSyCMJq0Flle9YD6KSvcaUyKGjU6JSoLjm1s',
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
  },
  cache: {
    ttl: 3600, // 1 hour
    checkPeriod: 600 // 10 minutes
  }
}; 