"use client";

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';

interface Provider {
  id: string;
  name: string;
  enabled: boolean;
}

interface ApiResponse {
  providers: Provider[];
  error?: {
    message: string;
  };
}

export default function AuthProvidersTest() {
  const { getProviders } = useAuth();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const response = await getProviders();
      const result = response as ApiResponse;

      if (result.error) {
        throw new Error(result.error.message);
      }

      setProviders(result.providers);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching providers');
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Test Auth Providers</h1>
      
      <div className="space-y-4">
        <button
          onClick={() => void fetchProviders()}
          disabled={loading}
          className={`px-4 py-2 rounded ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-teal-600 hover:bg-teal-700'
          } text-white`}
        >
          {loading ? 'Loading...' : 'Fetch Providers'}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {providers.length > 0 && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-4">Available Providers:</h2>
          <div className="space-y-2">
            {providers.map(provider => (
              <div
                key={provider.id}
                className="p-4 bg-gray-50 rounded flex justify-between items-center"
              >
                <span className="font-medium">{provider.name}</span>
                <span className={`px-2 py-1 rounded text-sm ${
                  provider.enabled
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {provider.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 