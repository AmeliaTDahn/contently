"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { env } from "@/env";

export default function TestAuth() {
  const [status, setStatus] = useState<string>("Loading...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkSupabase() {
      try {
        // Test if we can access Supabase
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          setError(`Error: ${error.message}`);
          setStatus("Failed");
        } else {
          setStatus("Success! Supabase client is correctly configured.");
          console.log("Session data:", data);
        }
      } catch (err) {
        setError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
        setStatus("Failed");
      }
    }

    checkSupabase();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Auth Test</h1>
      <div className="mb-4">
        <p><strong>Status:</strong> {status}</p>
        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded">
            {error}
          </div>
        )}
      </div>
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Debug Information</h2>
        <p><strong>Supabase URL:</strong> {env.NEXT_PUBLIC_SUPABASE_URL}</p>
        <p><strong>API Key Length:</strong> {env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length} characters</p>
      </div>
    </div>
  );
} 