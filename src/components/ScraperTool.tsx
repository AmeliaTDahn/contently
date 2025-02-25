"use client";

import { useState } from "react";
import Image from "next/image";

interface ScraperResult {
  success: boolean;
  data: any;
  message: string;
  errorDetails?: {
    message?: string;
    stack?: string;
    name?: string;
  };
}

export default function ScraperTool() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScraperResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      setError("Please enter a URL");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setErrorDetails(null);
    setResult(null);
    
    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Handle detailed error information
        setErrorDetails(data.errorDetails || data);
        throw new Error(data.error || "Failed to scrape URL");
      }
      
      setResult(data);
    } catch (err) {
      console.error("Scraping error:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Advanced Web Scraper (Puppeteer)</h2>
      
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="mb-4">
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
            URL to Scrape
          </label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 rounded-md font-medium flex items-center justify-center ${
            isLoading
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-teal-600 text-white hover:bg-teal-700"
          } transition-colors`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Scraping...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Scrape Website
            </>
          )}
        </button>
      </form>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 border border-red-100">
          <h3 className="font-semibold mb-2">Error</h3>
          <p>{error}</p>
          
          {errorDetails && (
            <div className="mt-4 pt-4 border-t border-red-100">
              <h4 className="font-medium mb-2">Error Details</h4>
              
              {errorDetails.name && (
                <p className="text-sm mb-1"><span className="font-semibold">Type:</span> {errorDetails.name}</p>
              )}
              
              {errorDetails.message && (
                <p className="text-sm mb-1"><span className="font-semibold">Message:</span> {errorDetails.message}</p>
              )}
              
              {errorDetails.stack && (
                <div className="mt-2">
                  <p className="text-sm font-semibold mb-1">Stack Trace:</p>
                  <pre className="text-xs bg-red-100 p-2 rounded overflow-x-auto max-h-40">
                    {errorDetails.stack}
                  </pre>
                </div>
              )}
              
              <div className="mt-4">
                <h4 className="font-medium mb-2">Troubleshooting Tips</h4>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  <li>Check if the URL is accessible in your browser</li>
                  <li>Some websites may block automated scraping</li>
                  <li>Complex JavaScript-heavy sites might require additional configuration</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
      
      {result && result.success && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Scraping Results</h3>
            <p className="text-sm text-gray-600">Method: Puppeteer</p>
            <p className="text-sm text-gray-600 mt-1">
              <span className="font-medium">Note:</span> All relative URLs have been converted to absolute URLs for proper linking.
            </p>
          </div>
          
          <div className="p-4 space-y-6">
            {/* Metadata Section */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Metadata</h4>
              <div className="bg-gray-50 p-3 rounded-md">
                <p><span className="font-semibold">Title:</span> {result.data.metadata?.title || result.data.title}</p>
                <p><span className="font-semibold">Description:</span> {result.data.metadata?.description || result.data.description}</p>
                {result.data.metadata?.ogTitle && (
                  <p><span className="font-semibold">OG Title:</span> {result.data.metadata.ogTitle}</p>
                )}
                {result.data.metadata?.canonicalUrl && (
                  <p><span className="font-semibold">Canonical URL:</span> {result.data.metadata.canonicalUrl}</p>
                )}
              </div>
            </div>
            
            {/* Headings Section */}
            {(result.data.headings || result.data.h1Tags) && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Headings</h4>
                <div className="bg-gray-50 p-3 rounded-md">
                  {result.data.headings?.h1 && result.data.headings.h1.length > 0 && (
                    <div className="mb-2">
                      <p className="font-semibold">H1 Tags:</p>
                      <ul className="list-disc pl-5">
                        {result.data.headings.h1.slice(0, 5).map((h1: string, i: number) => (
                          <li key={i}>{h1}</li>
                        ))}
                        {result.data.headings.h1.length > 5 && <li>...and {result.data.headings.h1.length - 5} more</li>}
                      </ul>
                    </div>
                  )}
                  
                  {result.data.h1Tags && result.data.h1Tags.length > 0 && (
                    <div className="mb-2">
                      <p className="font-semibold">H1 Tags:</p>
                      <ul className="list-disc pl-5">
                        {result.data.h1Tags.slice(0, 5).map((h1: string, i: number) => (
                          <li key={i}>{h1}</li>
                        ))}
                        {result.data.h1Tags.length > 5 && <li>...and {result.data.h1Tags.length - 5} more</li>}
                      </ul>
                    </div>
                  )}
                  
                  {result.data.headings?.h2 && result.data.headings.h2.length > 0 && (
                    <div>
                      <p className="font-semibold">H2 Tags:</p>
                      <ul className="list-disc pl-5">
                        {result.data.headings.h2.slice(0, 5).map((h2: string, i: number) => (
                          <li key={i}>{h2}</li>
                        ))}
                        {result.data.headings.h2.length > 5 && <li>...and {result.data.headings.h2.length - 5} more</li>}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Links Section */}
            {result.data.links && result.data.links.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Links ({result.data.links.length} total)</h4>
                <div className="bg-gray-50 p-3 rounded-md max-h-60 overflow-y-auto">
                  <ul className="list-disc pl-5">
                    {result.data.links.map((link: any, i: number) => (
                      <li key={i}>
                        <a 
                          href={link.href} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-teal-600 hover:underline"
                          title={link.originalHref ? `Original: ${link.originalHref}` : ''}
                        >
                          {link.text || link.href || 'No text or href'}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            
            {/* Images Section */}
            {result.data.images && result.data.images.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Images ({result.data.images.length} total)</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {result.data.images.slice(0, 8).map((img: any, i: number) => (
                    <div key={i} className="border border-gray-200 rounded-md overflow-hidden">
                      {img.src && (
                        <div className="aspect-square relative bg-gray-100">
                          <img
                            src={img.src}
                            alt={img.alt || 'Image'}
                            className="object-contain w-full h-full"
                            onError={(e) => {
                              const imgElement = e.target as HTMLImageElement;
                              imgElement.style.display = 'none';
                              const errorDiv = imgElement.parentElement?.querySelector('div');
                              if (errorDiv) {
                                errorDiv.classList.remove('hidden');
                              }
                            }}
                          />
                          <div className="hidden absolute inset-0 flex items-center justify-center text-gray-400 text-xs text-center p-2">
                            Unable to load image
                          </div>
                        </div>
                      )}
                      <div className="p-2 text-xs truncate" title={img.alt || 'No alt text'}>
                        {img.alt || 'No alt text'}
                      </div>
                    </div>
                  ))}
                </div>
                {result.data.images.length > 8 && (
                  <p className="text-sm text-gray-500 mt-2">...and {result.data.images.length - 8} more images</p>
                )}
              </div>
            )}
            
            {/* Screenshot (Puppeteer only) */}
            {result.data.screenshot && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Page Screenshot</h4>
                <div className="border border-gray-200 rounded-md overflow-hidden">
                  <img 
                    src={result.data.screenshot} 
                    alt="Page screenshot" 
                    className="w-full h-auto"
                  />
                </div>
              </div>
            )}
            
            {/* Tables Section */}
            {result.data.tables && result.data.tables.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Tables ({result.data.tables.length} total)</h4>
                <div className="space-y-4">
                  {result.data.tables.slice(0, 2).map((table: any, i: number) => (
                    <div key={i} className="border border-gray-200 rounded-md overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        {table.headers && table.headers.length > 0 && (
                          <thead className="bg-gray-50">
                            <tr>
                              {table.headers.map((header: string, j: number) => (
                                <th 
                                  key={j}
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                        )}
                        <tbody className="bg-white divide-y divide-gray-200">
                          {table.rows && table.rows.slice(0, 5).map((row: string[], j: number) => (
                            <tr key={j}>
                              {row.map((cell: string, k: number) => (
                                <td key={k} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                  {result.data.tables.length > 2 && (
                    <p className="text-sm text-gray-500">...and {result.data.tables.length - 2} more tables</p>
                  )}
                </div>
              </div>
            )}
            
            {/* Structured Data (JSON-LD) */}
            {result.data.structuredData && result.data.structuredData.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Structured Data (JSON-LD)</h4>
                <div className="bg-gray-50 p-3 rounded-md">
                  <pre className="text-xs overflow-x-auto max-h-60">
                    {JSON.stringify(result.data.structuredData, null, 2)}
                  </pre>
                </div>
              </div>
            )}
            
            {/* Main Content Preview */}
            {result.data.mainContent && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Full Content</h4>
                <div className="bg-gray-50 p-3 rounded-md max-h-[500px] overflow-y-auto">
                  <p className="text-sm text-gray-600 whitespace-pre-line">
                    {result.data.mainContent}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 