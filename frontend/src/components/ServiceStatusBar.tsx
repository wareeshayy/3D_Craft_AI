import { AlertCircle, CheckCircle, Wifi, WifiOff } from 'lucide-react';
import React from 'react';

type ServiceStatus = 'checking' | 'online' | 'offline';

interface ServiceStatusBarProps {
  status: ServiceStatus;
  backendUrl: string;
}

export const ServiceStatusBar: React.FC<ServiceStatusBarProps> = ({ status, backendUrl }) => {
  const getStatusDisplay = () => {
    switch (status) {
      case 'checking':
        return (
          <div className="flex items-center gap-2 text-yellow-600">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-600 border-t-transparent"></div>
            <span className="text-sm">Checking service...</span>
          </div>
        );
      case 'online':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle size={16} />
            <span className="text-sm">Service Online</span>
          </div>
        );
      case 'offline':
        return (
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle size={16} />
            <span className="text-sm">Service Offline</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-2">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-gray-800">3DCraft AI</h1>
          {getStatusDisplay()}
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {status === 'online' ? <Wifi size={16} /> : <WifiOff size={16} />}
          <span>Backend: {backendUrl || 'localhost:8000'}</span>
        </div>
      </div>
    </div>
  );
};