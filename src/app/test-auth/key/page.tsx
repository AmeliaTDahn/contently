"use client";

import { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';
import { env } from "@/env";

export default function TestApiKey() {
  const [status, setStatus] = useState<string>("Testing API key...");
  const [error, setError] = useState<string | null>(null);
  const [keyInfo, setKeyInfo] = useState<any>(null);

  useEffect(() => {
    async function testApiKey() {
      try {
        // Create a new Supabase client with the API key
        const supabase = createClient(
          env.NEXT_PUBLIC_SUPABASE_URL,
          env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        
        // Try a simple API call to test the key
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          setError(`API Key Error: ${error.message}`);
          setStatus("Failed");
        } else {
          setStatus("Success! API key is valid.");
          setKeyInfo({
            url: env.NEXT_PUBLIC_SUPABASE_URL,
            keyLength: env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length,
            keyStart: env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 10) + '...',
            keyEnd: '...' + env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length - 10),
          });
        }
      } catch (err) {
        setError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
        setStatus("Failed");
      }
    }

    testApiKey();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase API Key Test</h1>
      <div className="mb-4">
        <p><strong>Status:</strong> {status}</p>
        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded">
            {error}
          </div>
        )}
      </div>
      
      {keyInfo && (
        <div className="mt-8 p-4 bg-gray-50 rounded">
          <h2 className="text-xl font-semibold mb-2">API Key Information</h2>
          <p><strong>Supabase URL:</strong> {keyInfo.url}</p>
          <p><strong>API Key Length:</strong> {keyInfo.keyLength} characters</p>
          <p><strong>API Key Format:</strong> {keyInfo.keyStart}{keyInfo.keyEnd}</p>
        </div>
      )}
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Troubleshooting Tips</h2>
        <ul className="list-disc pl-5">
          <li>Make sure your Supabase project has email/password authentication enabled</li>
          <li>Check that your API key has the correct permissions</li>
          <li>Verify that your Supabase URL is correct</li>
          <li>Ensure your API key is the anon key, not the service role key</li>
        </ul>
      </div>
    </div>
  );
} 