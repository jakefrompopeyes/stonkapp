'use client';

import { useEffect, useState } from 'react';

export default function DebugPage() {
  const [envVars, setEnvVars] = useState<{[key: string]: string}>({});
  
  useEffect(() => {
    // Only collect environment variables that start with NEXT_PUBLIC_
    const publicEnvVars: {[key: string]: string} = {};
    
    // Check if specific Supabase variables exist
    publicEnvVars['NEXT_PUBLIC_SUPABASE_URL'] = 
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set';
    
    publicEnvVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'] = 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set (value hidden)' : 'Not set';
    
    setEnvVars(publicEnvVars);
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Environment Variables Debug</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Public Environment Variables:</h2>
        
        {Object.keys(envVars).length === 0 ? (
          <p>No public environment variables found.</p>
        ) : (
          <ul className="list-disc pl-5">
            {Object.entries(envVars).map(([key, value]) => (
              <li key={key} className="mb-1">
                <span className="font-mono">{key}:</span> {value}
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div className="mt-6 bg-yellow-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Troubleshooting Tips:</h2>
        <ul className="list-disc pl-5">
          <li>Make sure environment variables are set in Vercel</li>
          <li>Environment variables must start with NEXT_PUBLIC_ to be accessible in the browser</li>
          <li>You may need to redeploy after adding environment variables</li>
          <li>Check for typos in variable names</li>
        </ul>
      </div>
    </div>
  );
} 