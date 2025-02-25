"use client";

import Link from "next/link";
import { env } from "@/env";

export default function TroubleshootingGuide() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Supabase Authentication Troubleshooting Guide</h1>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Issue: "Bad API key" Error</h2>
        <p className="mb-4">
          If you're seeing a "Bad API key" error when trying to sign up or sign in, follow these steps to resolve it:
        </p>
        
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
          <p className="font-medium">Current Configuration:</p>
          <ul className="list-disc pl-5 mt-2">
            <li>Supabase URL: {env.NEXT_PUBLIC_SUPABASE_URL}</li>
            <li>API Key Length: {env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length} characters</li>
          </ul>
        </div>
        
        <ol className="list-decimal pl-5 space-y-4">
          <li>
            <strong>Verify your API key:</strong>
            <ul className="list-disc pl-5 mt-1">
              <li>Go to your <a href="https://app.supabase.io" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Supabase Dashboard</a></li>
              <li>Select your project</li>
              <li>Go to Project Settings {'->'} API</li>
              <li>Under "Project API keys", copy the "anon public" key (not the service_role key)</li>
              <li>Update your .env file with this key</li>
              <li>Restart your development server</li>
            </ul>
          </li>
          
          <li>
            <strong>Check CORS settings:</strong>
            <ul className="list-disc pl-5 mt-1">
              <li>In your Supabase Dashboard, go to Project Settings {'->'} API</li>
              <li>Under "API Settings", find "CORS (Cross-Origin Resource Sharing)"</li>
              <li>Add your local development URL (http://localhost:3001) to the allowed origins</li>
              <li>Save the changes</li>
            </ul>
          </li>
          
          <li>
            <strong>Enable Email/Password Authentication:</strong>
            <ul className="list-disc pl-5 mt-1">
              <li>In your Supabase Dashboard, go to Authentication {'->'} Providers</li>
              <li>Make sure "Email" is enabled</li>
              <li>Configure email templates if needed</li>
            </ul>
          </li>
          
          <li>
            <strong>Check for typos in your environment variables:</strong>
            <ul className="list-disc pl-5 mt-1">
              <li>Make sure there are no extra spaces or line breaks in your API key</li>
              <li>Verify that the URL format is correct (should be https://your-project-id.supabase.co)</li>
            </ul>
          </li>
          
          <li>
            <strong>Try a different browser or incognito mode:</strong>
            <ul className="list-disc pl-5 mt-1">
              <li>Sometimes browser extensions or cached data can interfere with authentication</li>
            </ul>
          </li>
        </ol>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Diagnostic Tests</h2>
        <p className="mb-4">
          Use these diagnostic tests to help identify the specific issue:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/test-auth" className="block p-4 border rounded-lg hover:bg-gray-50">
            <h3 className="font-medium">Basic Configuration Test</h3>
            <p className="text-sm text-gray-600">Tests if the Supabase client is correctly configured</p>
          </Link>
          
          <Link href="/test-auth/key" className="block p-4 border rounded-lg hover:bg-gray-50">
            <h3 className="font-medium">API Key Test</h3>
            <p className="text-sm text-gray-600">Tests if your API key is valid</p>
          </Link>
          
          <Link href="/test-auth/providers" className="block p-4 border rounded-lg hover:bg-gray-50">
            <h3 className="font-medium">Auth Providers Test</h3>
            <p className="text-sm text-gray-600">Tests if email/password authentication is enabled</p>
          </Link>
          
          <Link href="/test-auth/cors" className="block p-4 border rounded-lg hover:bg-gray-50">
            <h3 className="font-medium">CORS Test</h3>
            <p className="text-sm text-gray-600">Tests if there are CORS issues</p>
          </Link>
        </div>
      </div>
      
      <div className="bg-gray-50 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Still Having Issues?</h2>
        <p className="mb-4">
          If you're still experiencing problems after following these steps, try these additional resources:
        </p>
        
        <ul className="list-disc pl-5 space-y-2">
          <li><a href="https://supabase.com/docs/guides/auth" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Supabase Auth Documentation</a></li>
          <li><a href="https://github.com/supabase/supabase/discussions" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Supabase GitHub Discussions</a></li>
          <li><a href="https://discord.supabase.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Supabase Discord Community</a></li>
        </ul>
      </div>
    </div>
  );
} 