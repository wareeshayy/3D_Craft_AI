import { WifiOff } from 'lucide-react';
import React from 'react';

interface ServiceOfflineFallbackProps {
  onRetry: () => void;
}

export const ServiceOfflineFallback: React.FC<ServiceOfflineFallbackProps> = ({ onRetry }) => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <WifiOff className="mx-auto text-red-500 mb-4" size={48} />
        <h2 className="text-xl font-semibold text-red-800 mb-2">Backend Service Unavailable</h2>
        <p className="text-red-700 mb-4">
          Cannot connect to the 3D AI generation service. Please ensure your backend is running.
        </p>
        <div className="text-sm text-red-600 bg-red-100 p-3 rounded">
          <p><strong>To start the backend:</strong></p>
          <p>1. Navigate to your backend directory</p>
          <p>2. Run: <code className="bg-red-200 px-1 rounded">python main.py</code></p>
          <p>3. Ensure it's running on the correct port</p>
        </div>
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Retry Connection
        </button>
      </div>
    </div>
  );
};