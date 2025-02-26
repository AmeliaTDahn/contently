"use client";

export default function Troubleshoot() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Authentication Troubleshooting</h1>

      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-4">Common Issues</h2>
          
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium text-lg mb-2">Invalid API Key</h3>
              <p>
                If you&apos;re seeing API key errors, check that:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Your API key is correctly set in the environment variables</li>
                <li>You&apos;re using the correct key type (anon vs service_role)</li>
                <li>The key hasn&apos;t been revoked or expired</li>
              </ul>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium text-lg mb-2">CORS Issues</h3>
              <p>
                If you&apos;re experiencing CORS errors:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Add your domain to the allowed origins in Supabase dashboard</li>
                <li>Check that you&apos;re using &quot;https://&quot; for production URLs</li>
                <li>Verify your API endpoint is correctly formatted</li>
              </ul>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium text-lg mb-2">Authentication Flow</h3>
              <p>
                Common authentication flow issues:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Email confirmation is required but not sent</li>
                <li>Password requirements aren&apos;t met</li>
                <li>Rate limiting is preventing sign-in attempts</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Next Steps</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="mb-2">
              If you&apos;re still experiencing issues:
            </p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Check the browser console for detailed error messages</li>
              <li>Verify your Supabase project settings</li>
              <li>Review the authentication documentation</li>
              <li>Contact support if the issue persists</li>
            </ol>
          </div>
        </section>
      </div>
    </div>
  );
} 