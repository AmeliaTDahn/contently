"use client";

import { useState } from 'react';

interface ApiResponse {
  status: number;
  statusText: string;
  data?: {
    message?: string;
    [key: string]: unknown;
  };
  error?: {
    message: string;
  };
}

export default function CorsTest() {
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testCors = async () => {
    try {
      const res = await fetch('/api/test-cors', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json() as Record<string, unknown>;
      setResponse({
        status: res.status,
        statusText: res.statusText,
        data,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while testing CORS');
      setResponse(null);
    }
  };

  const testCorsError = async () => {
    try {
      const res = await fetch('/api/test-cors-error', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json() as Record<string, unknown>;
      setResponse({
        status: res.status,
        statusText: res.statusText,
        data,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while testing CORS error');
      setResponse(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Test CORS Configuration</h1>
      
      <div className="space-y-4">
        <button
          onClick={() => void testCors()}
          className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
        >
          Test CORS Success
        </button>
        
        <button
          onClick={() => void testCorsError()}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 ml-4"
        >
          Test CORS Error
        </button>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {response && (
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <h2 className="text-lg font-semibold mb-2">Response:</h2>
          <pre className="whitespace-pre-wrap">
            Status: {response.status} {response.statusText}
            {response.data && (
              <>
                {'\n'}Data: {JSON.stringify(response.data, null, 2)}
              </>
            )}
          </pre>
        </div>
      )}
    </div>
  );
} 