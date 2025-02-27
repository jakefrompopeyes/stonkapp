export default function DebugServerPage() {
  // This is a server component, so we can access environment variables directly
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set (value hidden)' : 'Not set';
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Server-Side Environment Variables Debug</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Environment Variables (Server-Side):</h2>
        
        <ul className="list-disc pl-5">
          <li className="mb-1">
            <span className="font-mono">NEXT_PUBLIC_SUPABASE_URL:</span> {supabaseUrl}
          </li>
          <li className="mb-1">
            <span className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY:</span> {supabaseAnonKey}
          </li>
        </ul>
      </div>
      
      <div className="mt-6 bg-yellow-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Troubleshooting Tips:</h2>
        <ul className="list-disc pl-5">
          <li>This page shows server-side environment variables</li>
          <li>If variables show as "Not set" here, they're not properly configured in Vercel</li>
          <li>Check that you've added the variables to the correct project in Vercel</li>
          <li>Make sure you've redeployed after adding environment variables</li>
        </ul>
      </div>
    </div>
  );
} 