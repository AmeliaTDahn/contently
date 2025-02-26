"use client";

import { useState, useEffect } from "react";
import { UrlScraper } from './UrlScraper';
import { useAuth } from "@/lib/auth-context";

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

interface AnalyticsResult {
  engagementScore: number;
  contentQualityScore: number;
  readabilityScore: number;
  seoScore: number;
  insights: {
    engagement: string[];
    content: string[];
    readability: string[];
    seo: string[];
  };
}

interface ApiResponse {
  error?: { message: string };
  data?: AnalyticsResult;
}

interface SelectedUrl {
  id: number | string;
  url: string;
}

export const ContentAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [result, setResult] = useState<AnalyticsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingUrls, setIsLoadingUrls] = useState(false);
  const [selectedUrls, setSelectedUrls] = useState<SelectedUrl[]>([]);
  const [currentUrlIndex, setCurrentUrlIndex] = useState<number>(-1);
  const [analysisResults, setAnalysisResults] = useState<Record<string, AnalyticsResult>>({});

  // Function to fetch database URLs
  const fetchDbUrls = async () => {
    setIsLoadingUrls(true);
    try {
      let response;
      
      // Check if we have URLs in localStorage first (from ScraperTool)
      const storedUrls = localStorage.getItem('analysisUrls');
      if (storedUrls) {
        try {
          const parsedUrls = JSON.parse(storedUrls) as SelectedUrl[];
          setSelectedUrls(parsedUrls);
          
          // Clear localStorage after retrieving URLs
          localStorage.removeItem('analysisUrls');
          
          // If we have URLs, start analyzing the first one
          if (parsedUrls.length > 0 && parsedUrls[0] && parsedUrls[0].url) {
            setCurrentUrlIndex(0);
            handleAnalyze(parsedUrls[0].url);
          }
          
          setIsLoadingUrls(false);
          return;
        } catch (err) {
          console.log('[ERROR] Error parsing stored URLs:', err);
        }
      }
      
      // If no URLs in localStorage or error parsing, fetch from database
      if (user?.id) {
        response = await fetch(`/api/user-analyzed-urls?userId=${user.id}`);
      } else {
        const localUrls = localStorage.getItem('analyzedUrls');
        const urlArray = localUrls ? JSON.parse(localUrls) : [];
        
        if (urlArray.length === 0) {
          setIsLoadingUrls(false);
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
      
      // Convert database URLs to the format expected by the component
      const formattedUrls = data.urls
        .filter((item: DbUrlRecord) => item.status === 'completed')
        .map((item: DbUrlRecord) => ({
          id: item.id,
          url: item.url
        }));
      
      setSelectedUrls(formattedUrls);
      
      // If we have URLs, start analyzing the first one
      if (formattedUrls.length > 0) {
        setCurrentUrlIndex(0);
        handleAnalyze(formattedUrls[0].url);
      }
    } catch (err) {
      console.error('Error fetching analyzed URLs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch URLs');
    } finally {
      setIsLoadingUrls(false);
    }
  };

  // Fetch URLs when component mounts
  useEffect(() => {
    fetchDbUrls();
  }, [user]);

  // When currentUrlIndex changes, analyze the next URL
  useEffect(() => {
    if (currentUrlIndex >= 0 && currentUrlIndex < selectedUrls.length) {
      const urlItem = selectedUrls[currentUrlIndex];
      if (urlItem && urlItem.url) {
        handleAnalyze(urlItem.url);
      }
    }
  }, [currentUrlIndex]);

  const handleAnalyze = async (url: string) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json() as ApiResponse;

      if (!response.ok) {
        throw new Error(data.error?.message ?? 'Failed to analyze content');
      }

      if (!data.data) {
        throw new Error('No analysis data received from the server');
      }

      // Store result for this URL
      setAnalysisResults(prev => ({
        ...prev,
        [url]: data.data as AnalyticsResult
      }));
      
      // Set the current result
      setResult(data.data);
      setError(null);
      
      // If we're analyzing multiple URLs, move to the next one
      if (selectedUrls.length > 0 && currentUrlIndex < selectedUrls.length - 1) {
        setTimeout(() => {
          setCurrentUrlIndex(prev => prev + 1);
        }, 500); // Small delay between analyses
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setResult(null);
      
      // If error occurs but we have more URLs, try the next one
      if (selectedUrls.length > 0 && currentUrlIndex < selectedUrls.length - 1) {
        setTimeout(() => {
          setCurrentUrlIndex(prev => prev + 1);
        }, 500);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Function to switch between analyzed URLs
  const switchToUrl = (url: string) => {
    if (analysisResults[url]) {
      setResult(analysisResults[url]);
      setError(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <UrlScraper onAnalyze={handleAnalyze} />
      </div>

      {/* Loading state for URLs */}
      {isLoadingUrls && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Loading your analyzed URLs...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Display selected URLs if any */}
      {selectedUrls.length > 0 && Object.keys(analysisResults).length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Analyzed URLs</h3>
          <div className="flex flex-wrap gap-2">
            {selectedUrls.map((urlItem, index) => (
              <button
                key={index}
                onClick={() => switchToUrl(urlItem.url)}
                className={`px-4 py-2 rounded-md text-sm ${
                  result === analysisResults[urlItem.url]
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {new URL(urlItem.url).hostname}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No URLs message */}
      {!isLoadingUrls && selectedUrls.length === 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                No URLs found for analysis. Please go to the <a href="/urls" className="font-medium underline">URLs page</a> to add content sources or enter a URL above.
              </p>
            </div>
          </div>
        </div>
      )}

      {isAnalyzing && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Analyzing content from {currentUrlIndex >= 0 && currentUrlIndex < selectedUrls.length 
                  ? selectedUrls[currentUrlIndex]?.url 
                  : "URL"}...
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Engagement Score</h3>
              <div className="text-3xl font-bold mb-4">{result.engagementScore}%</div>
              <p className="text-pink-100">Based on social shares and interactions</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Content Quality</h3>
              <div className="text-3xl font-bold mb-4">{result.contentQualityScore}%</div>
              <p className="text-purple-100">Measuring depth and originality</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Readability</h3>
              <div className="text-3xl font-bold mb-4">{result.readabilityScore}%</div>
              <p className="text-blue-100">Flesch Reading Ease score</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">SEO Score</h3>
              <div className="text-3xl font-bold mb-4">{result.seoScore}%</div>
              <p className="text-emerald-100">Search engine optimization</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">Engagement Insights</h3>
              <ul className="space-y-3">
                {result.insights.engagement.map((insight, index) => (
                  <li key={index} className="flex items-start">
                    <span className="flex-shrink-0 h-6 w-6 text-pink-500">
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    <span className="ml-2">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">Content Quality Insights</h3>
              <ul className="space-y-3">
                {result.insights.content.map((insight, index) => (
                  <li key={index} className="flex items-start">
                    <span className="flex-shrink-0 h-6 w-6 text-purple-500">
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    <span className="ml-2">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">Readability Insights</h3>
              <ul className="space-y-3">
                {result.insights.readability.map((insight, index) => (
                  <li key={index} className="flex items-start">
                    <span className="flex-shrink-0 h-6 w-6 text-blue-500">
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    <span className="ml-2">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">SEO Insights</h3>
              <ul className="space-y-3">
                {result.insights.seo.map((insight, index) => (
                  <li key={index} className="flex items-start">
                    <span className="flex-shrink-0 h-6 w-6 text-emerald-500">
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    <span className="ml-2">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 