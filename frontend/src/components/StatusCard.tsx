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
  return (
    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md shadow-sm">
      <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-200">
        {title}
      </h3>
      {loading ? (
        <p className="text-gray-600 dark:text-gray-300">Loading...</p>
      ) : (
        <p className="text-gray-600 dark:text-gray-300">{status}</p>
      )}
    </div>
  );
};

export default StatusCard; 