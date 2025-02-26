"use client";

import { useState } from 'react';

interface ApiResponse {
  url: string;
  keyLength: number;
  keyStart: string;
  keyEnd: string;
  error?: {
    message: string;
  };
}

export default function ApiKeyTest() {
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testApiKey = async () => {
    try {
      const res = await fetch('/api/test-key', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json() as {
        url?: string;
        keyLength?: number;
        keyStart?: string;
        keyEnd?: string;
        error?: {
          message: string;
        };
      };
      
      if (!res.ok) {
        throw new Error(data.error?.message ?? 'Failed to test API key');
      }

      if (data.url && data.keyLength !== undefined && data.keyStart && data.keyEnd) {
        setResponse({
          url: data.url,
          keyLength: data.keyLength,
          keyStart: data.keyStart,
          keyEnd: data.keyEnd
        });
      } else {
        throw new Error('Invalid response format');
      }
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while testing API key');
      setResponse(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Test API Key Configuration</h1>
      
      <div className="space-y-4">
        <button
          onClick={() => void testApiKey()}
          className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
        >
          Test API Key
        </button>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {response && (
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <h2 className="text-lg font-semibold mb-2">API Key Information:</h2>
          <div className="space-y-2">
            <p><strong>URL:</strong> {response.url}</p>
            <p><strong>Key Length:</strong> {response.keyLength}</p>
            <p><strong>Key Preview:</strong> {response.keyStart}...{response.keyEnd}</p>
          </div>
        </div>
      )}
    </div>
  );
} 