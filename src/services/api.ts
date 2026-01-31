const API_BASE_URL = 'http://localhost:3002/api';

interface SearchParams {
  location: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}

export async function searchHotels(params: SearchParams) {
  const queryParams = new URLSearchParams({
    area: params.location,
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    guests: params.guests.toString()
  });

  const response = await fetch(`${API_BASE_URL}/search?${queryParams}`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to search hotels');
  }

  return response.json();
}