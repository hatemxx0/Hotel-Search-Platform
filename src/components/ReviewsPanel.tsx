import React, { useState, useEffect } from 'react';
import { fetchHotelReviews } from '../utils/api';
import { LoadingState } from './LoadingState';
import { ErrorMessage } from './ErrorMessage';

interface Review {
  author: string;
  rating: number;
  text: string;
  relative_time_description: string;
}

interface ReviewsProps {
  placeId: string;
  hotelName: string;
}

export const ReviewsPanel: React.FC<ReviewsProps> = ({ placeId, hotelName }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
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
          <span className="text-gray-500">({reviews.length} reviews)</span>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-gray-500">No reviews available yet.</p>
        ) : (
          reviews.slice(0, 5).map((review, idx) => (
            <div key={idx} className="bg-white p-3 rounded border border-gray-200">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-sm">{review.author}</p>
                  <p className="text-xs text-gray-500">{review.relative_time_description}</p>
                </div>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}>
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-700 line-clamp-3">{review.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
