"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import type { ScraperResult } from "@/utils/scrapers";

interface ErrorDisplayProps {
  error: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error }) => (
  <div className="text-red-500 mt-2">{error}</div>
);

// Interface for database URL records
interface DbUrlRecord {
  id: number;
  url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage: string | null;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export const ScraperTool: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [url, setUrl] = useState("");
  const [dbUrls, setDbUrls] = useState<DbUrlRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUrls, setSelectedUrls] = useState<number[]>([]);

  // Fetch user's analyzed URLs from the database
  useEffect(() => {
    fetchDbUrls();
  }, [user]);

  // Function to fetch database URLs
  const fetchDbUrls = async () => {
    setIsLoading(true);
    try {
      let response;
      
      if (user?.id) {
        response = await fetch(`/api/user-analyzed-urls?userId=${user.id}`);
      } else {
        const localUrls = localStorage.getItem('analyzedUrls');
        const urlArray = localUrls ? JSON.parse(localUrls) : [];
        
        if (urlArray.length === 0) {
          setDbUrls([]);
          setIsLoading(false);
          return;
        }
        
        response = await fetch('/api/user-analyzed-urls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urls: urlArray }),
        });
      }

      if (!response.ok) {
        throw new Error('Failed to fetch analyzed URLs');
      }

      const data = await response.json();
      setDbUrls(data.urls);
      
      // Update local storage for anonymous users
      if (!user?.id) {
        const urlsToStore = data.urls.map((item: DbUrlRecord) => item.url);
        localStorage.setItem('analyzedUrls', JSON.stringify(urlsToStore));
      }
    } catch (err) {
      console.error('Error fetching analyzed URLs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      setError("Please enter a URL");
      return;
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (err) {
      setError("Please enter a valid URL (including http:// or https://)");
      return;
    }

    // Check if URL already exists in the database
    if (dbUrls.some(item => item.url === url)) {
      setError("This URL has already been analyzed");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    
    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          url,
          userId: user?.id
        }),
      });

      const data = await response.json() as ScraperResult;

      if (!response.ok) {
        throw new Error(data.error?.message ?? "Failed to analyze content");
      }
      
      // Store URL in local storage for anonymous users
      if (!user?.id) {
        const localUrls = localStorage.getItem('analyzedUrls');
        const urlArray = localUrls ? JSON.parse(localUrls) : [];
        if (!urlArray.includes(url)) {
          urlArray.push(url);
          localStorage.setItem('analyzedUrls', JSON.stringify(urlArray));
        }
      }
      
      // Refresh the database URLs list
      await fetchDbUrls();
      
      // Clear input
      setUrl("");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Add function to delete URL from database
  const handleDeleteUrl = async (id: number) => {
    try {
      // Show confirmation dialog
      if (!confirm("Are you sure you want to delete this URL? This action cannot be undone.")) {
        return;
      }

      // Delete from database
      const response = await fetch('/api/user-analyzed-urls', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id, 
          userId: user?.id 
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to delete URL');
      }

      // Remove from UI
      setDbUrls(prev => prev.filter(item => item.id !== id));

      // If anonymous user, update localStorage
      if (!user?.id) {
        const urlToDelete = dbUrls.find(item => item.id === id)?.url;
        if (urlToDelete) {
          const localUrls = localStorage.getItem('analyzedUrls');
          const urlArray = localUrls ? JSON.parse(localUrls) : [];
          const updatedUrls = urlArray.filter((url: string) => url !== urlToDelete);
          localStorage.setItem('analyzedUrls', JSON.stringify(updatedUrls));
        }
      }
    } catch (err) {
      console.error('Error deleting URL:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete URL');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'processing':
        return (
          <svg className="h-5 w-5 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case 'completed':
        return (
          <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'failed':
        return (
          <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Toggle URL selection for calendar
  const toggleUrlSelection = (id: number) => {
    setSelectedUrls(prev => 
      prev.includes(id) 
        ? prev.filter(urlId => urlId !== id) 
        : [...prev, id]
    );
  };

  // Navigate to calendar with selected URLs
  const handleGenerateCalendar = () => {
    if (selectedUrls.length === 0) {
      alert("Please select at least one URL to include in the calendar");
      return;
    }

    // Get the selected URL objects
    const urlsForCalendar = dbUrls
      .filter(item => selectedUrls.includes(item.id))
      .map(item => ({ id: item.id, url: item.url }));
    
    // Store selected URLs in localStorage for the calendar page
    localStorage.setItem('calendarUrls', JSON.stringify(urlsForCalendar));
    
    // Navigate to calendar page
    router.push('/calendar');
  };

  // Navigate to analytics with selected URLs
  const handleAnalyzeContent = () => {
    if (selectedUrls.length === 0) {
      alert("Please select at least one URL to analyze");
      return;
    }

    // Get the selected URL objects
    const urlsForAnalysis = dbUrls
      .filter(item => selectedUrls.includes(item.id))
      .map(item => ({ id: item.id, url: item.url }));
    
    // Store selected URLs in localStorage for the analytics page
    localStorage.setItem('analysisUrls', JSON.stringify(urlsForAnalysis));
    
    // Navigate to analytics page
    router.push('/analytics');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Content Analyzer</h2>
      
      <form onSubmit={handleAnalyzeUrl} className="mb-8">
        <div className="flex gap-4">
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter URL to analyze"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            required
            disabled={isAnalyzing}
          />
          <button
            type="submit"
            className={`px-6 py-2 rounded-md font-medium ${isAnalyzing ? 'bg-gray-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'} text-white`}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <span className="inline-block mr-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </span>
                Analyzing...
              </>
            ) : (
              'Analyze URL'
            )}
          </button>
        </div>
        {error && (
          <div className="text-red-500 mt-2 text-sm">{error}</div>
        )}
      </form>
      
      {/* Previously analyzed URLs from database */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Your Analyzed URLs</h3>
          <p className="text-sm text-gray-500 mt-1">
            History of all URLs you've analyzed
          </p>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center">
            <svg className="h-8 w-8 text-teal-500 animate-spin mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <p className="mt-2 text-gray-600">Loading your analyzed URLs...</p>
          </div>
        ) : dbUrls.length > 0 ? (
          <>
            <ul className="divide-y divide-gray-200">
              {dbUrls.map((item) => (
                <li key={item.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 mr-3">
                        <input
                          type="checkbox"
                          id={`url-${item.id}`}
                          checked={selectedUrls.includes(item.id)}
                          onChange={() => toggleUrlSelection(item.id)}
                          className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="flex-shrink-0">
                        {getStatusIcon(item.status)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-md">
                          {item.url}
                        </div>
                        <div className="flex text-xs text-gray-500 mt-1">
                          <span className="mr-4">Analyzed: {formatDate(item.createdAt)}</span>
                          {item.status === 'failed' && item.errorMessage && (
                            <span className="text-red-500">Error: {item.errorMessage}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteUrl(item.id)}
                      className="text-gray-400 hover:text-red-500"
                      title="Delete URL"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {selectedUrls.length} of {dbUrls.length} URLs selected
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleAnalyzeContent}
                    disabled={selectedUrls.length === 0}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      selectedUrls.length === 0 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    Analyze Content
                  </button>
                  <button
                    onClick={handleGenerateCalendar}
                    disabled={selectedUrls.length === 0}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      selectedUrls.length === 0 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-teal-600 text-white hover:bg-teal-700'
                    }`}
                  >
                    Generate Calendar
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No analyzed URLs yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Add a URL above to begin content analysis
            </p>
          </div>
        )}
      </div>
      
      {/* Calendar generation info */}
      {dbUrls.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Generate Content Calendar</h3>
          <p className="text-sm text-gray-600 mb-4">
            Select the URLs you want to include in your content calendar using the checkboxes above, 
            then click "Generate Calendar" to create a calendar view of your content.
          </p>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  The calendar will display content from your selected URLs, allowing you to plan and organize your content strategy.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 