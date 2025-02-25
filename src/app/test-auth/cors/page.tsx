"use client";

import { useState, useEffect } from "react";
import { env } from "@/env";

export default function TestCors() {
  const [status, setStatus] = useState<string>("Testing CORS...");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    async function checkCors() {
      try {
        // Make a direct fetch request to the Supabase API
        const response = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/`, {
          method: 'GET',
          headers: {
            'apikey': env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json().catch(() => null);
        
        if (!response.ok) {
          setError(`CORS Error: ${response.status} ${response.statusText}`);
          setStatus("Failed");
          setResult({ 
            status: response.status, 
            statusText: response.statusText,
            data 
          });
        } else {
          setStatus("Success! No CORS issues detected.");
          setResult({ 
            status: response.status, 
            statusText: response.statusText,
            data 
          });
        }
      } catch (err) {
        setError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
        setStatus("Failed - Possible CORS issue");
      }
    }

    checkCors();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase CORS Test</h1>
      <div className="mb-4">
        <p><strong>Status:</strong> {status}</p>
        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded">
            {error}
          </div>
        )}
      </div>
      
      {result && (
        <div className="mt-8 p-4 bg-gray-50 rounded">
          <h2 className="text-xl font-semibold mb-2">Response Information</h2>
          <p><strong>Status:</strong> {result.status} {result.statusText}</p>
          <p><strong>Data:</strong></p>
          <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">CORS Troubleshooting</h2>
        <p>If you're experiencing CORS issues, you need to:</p>
        <ol className="list-decimal pl-5 mt-2">
          <li>Go to your Supabase Dashboard</li>
          <li>Navigate to Project Settings {'->'} API</li>
          <li>Under "API Settings", find "CORS (Cross-Origin Resource Sharing)"</li>
          <li>Add your local development URL (http://localhost:3001) to the allowed origins</li>
        </ol>
      </div>
    </div>
  );
} 