"use client";

import { useState } from "react";

interface ScrapedImage {
  url: string;
  alt: string;
}

interface ScrapedContent {
  url: string;
  title: string;
  description: string;
  publishDate: string | null;
  content: string;
  images: ScrapedImage[];
  metadata: Record<string, string>;
}

export default function UrlScraper() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scrapedContent, setScrapedContent] = useState<ScrapedContent | null>(null);

  const handleScrape = async () => {
    if (!url) {
      setError("Please enter a URL");
      return;
    }

    // Basic URL validation
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    setIsLoading(true);
    setError(null);
    setScrapedContent(null);

    try {
      // Make the API request
      const response = await fetch('/api/scrape-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: formattedUrl }),
      });

      // Get the response as text first to safely parse it
      const responseText = await response.text();
      
      // Try to parse the JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        setError(`Failed to parse response: ${responseText.substring(0, 100)}...`);
        return;
      }
      
      // Check if the response was successful
      if (!response.ok) {
        if (response.status === 404) {
          setError(`Page not found (404). Please check if the URL is correct and accessible. Try a different URL or check if the website allows scraping.`);
        } else {
          setError(data?.error || `Error ${response.status}: ${response.statusText}`);
        }
        return;
      }
      
      // Set the scraped content
      setScrapedContent(data);
    } catch (err: any) {
      // Handle any unexpected errors
      setError(`Failed to scrape URL: ${err?.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4 text-gray-800">URL Content Scraper</h2>
        <p className="text-gray-600 mb-4">
          Enter a URL to extract content and metadata for analysis.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter a URL (e.g., example.com or https://example.com)"
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleScrape();
              }
            }}
          />
        </div>
        <button
          onClick={handleScrape}
          disabled={isLoading}
          className={`px-6 py-2 rounded-md flex items-center justify-center ${
            isLoading
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-teal-600 text-white hover:bg-teal-700"
          } transition-colors`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Scraping...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z" />
              </svg>
              Scrape URL
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md border border-red-100 flex flex-col items-start">
          <div className="flex items-start mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Error: {error}</span>
          </div>
          
          {error.includes('404') && (
            <div className="mt-2 text-sm">
              <p className="font-medium mb-1">Suggestions:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Check if the URL is spelled correctly</li>
                <li>Make sure the website is publicly accessible</li>
                <li>Try adding "www." before the domain name</li>
                <li>Try these example URLs that should work:
                  <ul className="list-disc pl-5 mt-1">
                    <li>https://www.bbc.com</li>
                    <li>https://www.nytimes.com</li>
                    <li>https://www.wikipedia.org</li>
                  </ul>
                </li>
              </ul>
            </div>
          )}
        </div>
      )}

      {scrapedContent && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">Scraped Content</h3>
          </div>
          
          <div className="p-4 space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">URL</h4>
              <p className="text-gray-800 break-all">{scrapedContent.url}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Title</h4>
              <p className="text-gray-800">{scrapedContent.title}</p>
            </div>
            
            {scrapedContent.description && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Description</h4>
                <p className="text-gray-800">{scrapedContent.description}</p>
              </div>
            )}
            
            {scrapedContent.publishDate && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Publish Date</h4>
                <p className="text-gray-800">{new Date(scrapedContent.publishDate).toLocaleString()}</p>
              </div>
            )}
            
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Content Preview</h4>
              <div className="bg-gray-50 p-3 rounded-md border border-gray-100 max-h-60 overflow-y-auto">
                <p className="text-gray-800 text-sm whitespace-pre-line">
                  {scrapedContent.content.length > 500 
                    ? `${scrapedContent.content.substring(0, 500)}...` 
                    : scrapedContent.content}
                </p>
              </div>
            </div>
            
            {scrapedContent.images && scrapedContent.images.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Images ({scrapedContent.images.length})</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {scrapedContent.images.map((image, index) => (
                    <div key={index} className="relative aspect-video bg-gray-100 rounded-md overflow-hidden border border-gray-200">
                      <img 
                        src={image.url} 
                        alt={image.alt || 'Scraped image'} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Replace broken images with placeholder
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Image+Error';
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {scrapedContent.metadata && Object.keys(scrapedContent.metadata).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Metadata</h4>
                <div className="bg-gray-50 p-3 rounded-md border border-gray-100 max-h-60 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-2 font-medium text-gray-600">Property</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-600">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(scrapedContent.metadata).map(([key, value], index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-2 px-2 font-medium text-gray-700">{key}</td>
                          <td className="py-2 px-2 text-gray-600 break-all">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Help section */}
      <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
        <h3 className="text-md font-semibold text-blue-800 mb-2">Tips for Successful Scraping</h3>
        <ul className="text-sm text-blue-700 space-y-1 list-disc pl-5">
          <li>Use complete URLs including the protocol (https://)</li>
          <li>Some websites may block scraping attempts</li>
          <li>News sites, blogs, and public information pages usually work best</li>
          <li>Try these example URLs:
            <ul className="list-disc pl-5 mt-1">
              <li>https://www.bbc.com</li>
              <li>https://www.nytimes.com</li>
              <li>https://en.wikipedia.org/wiki/Web_scraping</li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  );
} 