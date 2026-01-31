import React from 'react';

export const DemoMode: React.FC = () => {
  return (
    <div className="mt-8 p-4 bg-blue-50 rounded-lg">
      <h3 className="text-lg font-medium text-blue-900 mb-2">🎯 Demo Mode</h3>
      <p className="text-blue-700">
        This is a demo application. Hotel prices and availability are simulated.
        In a production environment, this would use real data from the Booking.com API.
      </p>
    </div>
  );
}; 