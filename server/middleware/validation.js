export function validateSearchQuery(req, res, next) {
  const { area, checkIn, checkOut, guests } = req.query;
  const errors = [];
  
  // Validate area
  if (!area || typeof area !== 'string' || area.trim().length < 2) {
    errors.push('Area must be at least 2 characters long');
  } else if (area.trim().length > 100) {
    errors.push('Area must be less than 100 characters');
  }
  
  // Validate dates
  if (checkIn) {
    const checkInDate = new Date(checkIn);
    if (isNaN(checkInDate.getTime())) {
      errors.push('Invalid check-in date format');
    } else if (checkInDate < new Date().setHours(0, 0, 0, 0)) {
      errors.push('Check-in date cannot be in the past');
    }
  }
  
  if (checkOut) {
    const checkOutDate = new Date(checkOut);
    if (isNaN(checkOutDate.getTime())) {
      errors.push('Invalid check-out date format');
    } else if (checkIn && checkOutDate <= new Date(checkIn)) {
      errors.push('Check-out date must be after check-in date');
    }
  }
  
  // Validate guests
  if (guests) {
    const guestCount = parseInt(guests);
    if (isNaN(guestCount) || guestCount < 1 || guestCount > 10) {
      errors.push('Guest count must be between 1 and 10');
    }
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Please correct the following errors:',
      details: errors
    });
  }
  
  // Sanitize inputs
  req.query.area = area.trim();
  if (checkIn) req.query.checkIn = checkIn.trim();
  if (checkOut) req.query.checkOut = checkOut.trim();
  if (guests) req.query.guests = parseInt(guests);
  
  next();
}

export function validateCoordinates(req, res, next) {
  const { latitude, longitude } = req.body;
  
  if (!latitude || !longitude) {
    return res.status(400).json({
      error: 'Missing coordinates',
      message: 'Latitude and longitude are required'
    });
  }
  
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  
  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({
      error: 'Invalid coordinates',
      message: 'Latitude and longitude must be valid numbers'
    });
  }
  
  if (lat < -90 || lat > 90) {
    return res.status(400).json({
      error: 'Invalid latitude',
      message: 'Latitude must be between -90 and 90'
    });
  }
  
  if (lng < -180 || lng > 180) {
    return res.status(400).json({
      error: 'Invalid longitude',
      message: 'Longitude must be between -180 and 180'
    });
  }
  
  req.body.latitude = lat;
  req.body.longitude = lng;
  
  next();
}