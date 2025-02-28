import React from 'react';

interface StatusCardProps {
  title: string;
  status: string;
  loading?: boolean;
}

const StatusCard: React.FC<StatusCardProps> = ({ 
  title, 
  status, 
  loading = false 
}) => {
  // Determine the status color
  const getStatusColor = () => {
    if (loading) return 'bg-yellow-500';
    if (status.includes('Error') || status.includes('error')) return 'bg-red-500';
    return 'bg-green-500';
  };

  // Determine the status text
  const getStatusText = () => {
    if (loading) return 'Connecting...';
    if (status.includes('Error') || status.includes('error')) return 'Offline';
    return 'Online';
  };

  return (
    <div className="bg-white p-4 rounded-md shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-700">
          {title}
        </h3>
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${getStatusColor()}`}></div>
          <span className="text-sm font-medium text-gray-600">
            {getStatusText()}
          </span>
        </div>
      </div>
      
      <p className="text-gray-600 text-sm">
        {loading ? 'Checking connection status...' : status}
      </p>
    </div>
  );
};

export default StatusCard; 