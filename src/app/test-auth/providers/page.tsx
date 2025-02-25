"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthProviders() {
  const [providers, setProviders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuthProviders() {
      try {
        // Try to sign up with a test email to see what providers are available
        const { error } = await supabase.auth.signUp({
          email: 'test@example.com',
          password: 'password123',
        });

        if (error) {
          // Check if the error message contains information about available providers
          setError(`Error: ${error.message}`);
        } else {
          setProviders(['Email/Password is enabled']);
        }
      } catch (err) {
        setError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    }

    checkAuthProviders();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Auth Providers Test</h1>
      
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div>
          {error ? (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded">
              {error}
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold mb-2">Available Providers:</h2>
              {providers.length > 0 ? (
                <ul className="list-disc pl-5">
                  {providers.map((provider, index) => (
                    <li key={index}>{provider}</li>
                  ))}
                </ul>
              ) : (
                <p>No providers detected.</p>
              )}
            </div>
          )}
        </div>
      )}
      
      <div className="mt-8">
        <p className="text-sm text-gray-500">
          Note: This test attempts to sign up with a test email to check if email/password authentication is enabled.
          No actual account will be created.
        </p>
      </div>
    </div>
  );
} 