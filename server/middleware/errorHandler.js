export function errorHandler(err, req, res, next) {
  console.error('🚨 Unhandled error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
      ...(isDevelopment && { stack: err.stack })
    });
  }

  if (err.name === 'APIError') {
    return res.status(err.status || 502).json({
      error: 'External API Error',
      message: 'One or more external services are currently unavailable',
      provider: err.provider,
      ...(isDevelopment && { details: err.message, stack: err.stack })
    });
  }

  if (err.name === 'GeocodingError') {
    return res.status(err.status || 500).json({
      error: 'Location Error',
      message: err.message,
      ...(isDevelopment && { stack: err.stack })
    });
  }

  // Rate limiting error
  if (err.status === 429) {
    return res.status(429).json({
      error: 'Rate Limit Exceeded',
      message: 'Too many requests. Please try again later.',
      retryAfter: err.retryAfter || 60
    });
  }

  // Default server error
  res.status(500).json({
    error: 'Internal Server Error',
    message: isDevelopment ? err.message : 'Something went wrong. Please try again later.',
    ...(isDevelopment && { stack: err.stack })
  });
}