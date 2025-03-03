"use client";

import React, { useState, useEffect } from 'react';
import { UrlScraper } from './UrlScraper';
import { useAuth } from "@/lib/auth-context";
import { InfoIcon, Loader2 } from 'lucide-react';
import type { AnalyticsResult } from '../types/analytics';

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

interface ApiResponse {
  error?: { message: string };
  data?: ExtendedAnalytics;
}

interface SelectedUrl {
  id: number | string;
  url: string;
}

interface EngagementMetrics {
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
  totalViews: number;
  uniqueViews: number;
  avgTimeOnPage: number;
  bounceRate: number;
  socialShares: {
    facebook: number;
    twitter: number;
    linkedin: number;
    pinterest: number;
  };
  explanations?: {
    likes: string;
    comments: string;
    shares: string;
    bookmarks: string;
    totalViews: string;
    uniqueViews: string;
    avgTimeOnPage: string;
    bounceRate: string;
    socialShares: string;
  };
}

interface WritingQuality {
  grammar: number;
  clarity: number;
  structure: number;
  vocabulary: number;
  overall: number;
  explanations?: {
    grammar: string;
    clarity: string;
    structure: string;
    vocabulary: string;
    overall: string;
  };
}

interface ExtendedAnalytics {
  analyzedUrlId: number;
  engagementScore: number;
  contentQualityScore: number;
  readabilityScore: number;
  seoScore: number;
  industry: string;
  scope: string;
  topics: string[];
  writingQuality: {
    overall: number;
    explanations?: {
      [key: string]: string;
    };
  };
  audienceLevel: string;
  contentType: string;
  tone: string;
  estimatedReadTime: number;
  keywords: Array<{
    text: string;
    count: number;
  }>;
  keywordAnalysis: {
    distribution: string;
    overused: string[];
    underused: string[];
    explanation?: string;
  };
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    bookmarks: number;
    totalViews: number;
    uniqueViews: number;
    avgTimeOnPage: number;
    bounceRate: number;
    explanations?: {
      likes?: string;
      comments?: string;
      shares?: string;
      bookmarks?: string;
      totalViews?: string;
      uniqueViews?: string;
      avgTimeOnPage?: string;
      bounceRate?: string;
    };
  };
  insights: {
    content: string[];
    seo: string[];
    engagement: string[];
    readability: string[];
  };
  industryExplanation?: string;
  scopeExplanation?: string;
  topicsExplanation?: string;
  audienceLevelExplanation?: string;
  contentTypeExplanation?: string;
  toneExplanation?: string;
  engagementExplanation?: string;
  contentQualityExplanation?: string;
  readabilityExplanation?: string;
  seoExplanation?: string;
  wordCountStats: {
    count: number;
    min: number;
    max: number;
    avg: number;
    sum: number;
    explanations?: {
      count?: string;
      min?: string;
      max?: string;
      avg?: string;
      sum?: string;
    };
  };
  articlesPerMonth: Array<{
    date: string;
    count: number;
    explanation?: string;
  }>;
}

// Add Tooltip component
const Tooltip = ({ content }: { content: string }) => (
  <div className="group relative flex items-center">
    <InfoIcon className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help ml-2" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-sm rounded shadow-lg z-50">
      {content}
      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-2 border-8 border-transparent border-t-gray-900" />
    </div>
  </div>
);

export const ContentAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [result, setResult] = useState<ExtendedAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingUrls, setIsLoadingUrls] = useState(false);
  const [selectedUrls, setSelectedUrls] = useState<SelectedUrl[]>([]);
  const [currentUrlIndex, setCurrentUrlIndex] = useState<number>(-1);
  const [analysisResults, setAnalysisResults] = useState<Record<string, ExtendedAnalytics>>({});
  const [loadedFromCache, setLoadedFromCache] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [activeStatsTab, setActiveStatsTab] = useState<string>('metrics');
  const [explanations, setExplanations] = useState<{
    industry?: string;
    scope?: string;
    topics?: string;
    audienceLevel?: string;
    contentType?: string;
    tone?: string;
    engagement?: string;
    contentQuality?: string;
    readability?: string;
    seo?: string;
    wordCountStats?: {
      count?: string;
      min?: string;
      max?: string;
      avg?: string;
      sum?: string;
    };
    articlesPerMonth?: { [key: string]: string };
  }>({});
  const [inputUrl, setInputUrl] = useState<string>('');

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
    if (!url) return;
    
    setIsAnalyzing(true);
    setError(null);
    setLoadedFromCache(false);
    
    try {
      // Record the start time to detect if results came from cache
      const startTime = Date.now();
      
      const response = await fetch('/api/analyze-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json() as ApiResponse;
      
      // If the response was very fast (less than 1 second), it likely came from cache
      const responseTime = Date.now() - startTime;
      setLoadedFromCache(responseTime < 1000);

      if (!response.ok) {
        throw new Error(data.error?.message ?? 'Failed to analyze content');
      }

      if (!data.data) {
        throw new Error('No analysis data received from the server');
      }

      // Store result for this URL
      setAnalysisResults(prev => ({
        ...prev,
        [url]: data.data as ExtendedAnalytics
      }));
      
      // Set the current result
      setResult(data.data as ExtendedAnalytics);
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
      setResult(analysisResults[url] as ExtendedAnalytics);
      setError(null);
    }
  };

  useEffect(() => {
    if (result) {
      setExplanations({
        industry: result.industryExplanation,
        scope: result.scopeExplanation,
        topics: result.topicsExplanation,
        audienceLevel: result.audienceLevelExplanation,
        contentType: result.contentTypeExplanation,
        tone: result.toneExplanation,
        engagement: result.engagementExplanation,
        contentQuality: result.contentQualityExplanation,
        readability: result.readabilityExplanation,
        seo: result.seoExplanation,
        wordCountStats: result.wordCountStats?.explanations,
        articlesPerMonth: result.articlesPerMonth?.reduce((acc: { [key: string]: string }, month: { date: string; explanation?: string }) => ({
          ...acc,
          [month.date]: month.explanation || ''
        }), {})
      });
    }
  }, [result]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Content Analytics Dashboard</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Messages */}
        <div className="space-y-4 mb-8">
      {isLoadingUrls && (
            <div className="bg-white border-l-4 border-teal-500 rounded-lg shadow-sm p-4">
          <div className="flex">
            <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-teal-500 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div className="ml-3">
                  <p className="text-sm text-gray-700">Loading your analyzed URLs...</p>
            </div>
          </div>
        </div>
      )}

          {isAnalyzing && (
            <div className="bg-white border-l-4 border-teal-500 rounded-lg shadow-sm p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Loader2 className="h-5 w-5 text-teal-500 animate-spin" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-700">Analyzing content, please wait. This may take up to 2 minutes...</p>
                </div>
          </div>
        </div>
      )}

      {loadedFromCache && result && (
            <div className="bg-white border-l-4 border-teal-500 rounded-lg shadow-sm p-4">
          <div className="flex">
            <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-3">
                  <p className="text-sm text-gray-700">Results loaded from cache for faster viewing</p>
            </div>
          </div>
        </div>
      )}

          {error && (
            <div className="bg-white border-l-4 border-red-500 rounded-lg shadow-sm p-4">
          <div className="flex">
            <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
        </div>

        {/* URL Selection */}
        {selectedUrls.length > 0 && Object.keys(analysisResults).length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Analyzed Content</h2>
            <div className="flex flex-wrap gap-3">
              {selectedUrls.map((urlItem) => (
                <button
                  key={urlItem.id}
                  onClick={() => switchToUrl(urlItem.url)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    result && analysisResults[urlItem.url] === result
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {urlItem.url.length > 30 ? `${urlItem.url.substring(0, 30)}...` : urlItem.url}
                </button>
              ))}
      {isAnalyzing && (
                <div className="flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-teal-600" />
                  Analyzing...
            </div>
              )}
          </div>
        </div>
      )}

        {result && (
          <>
            {/* Main Metrics - Always visible */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Engagement</h3>
            </div>
                  <span className="text-3xl font-bold text-teal-600">{result.engagementScore}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                  <div
                    className="bg-teal-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${result.engagementScore}%` }}
                  />
                </div>
                {result.engagementExplanation && (
                  <details className="mt-2">
                    <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                      View Explanation
                    </summary>
                    <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                      {result.engagementExplanation}
                    </p>
                  </details>
                )}
            </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Content Quality</h3>
          </div>
                  <span className="text-3xl font-bold text-teal-600">{result.contentQualityScore}%</span>
        </div>
                <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                  <div
                    className="bg-teal-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${result.contentQualityScore}%` }}
                  />
                </div>
                {result.contentQualityExplanation && (
                  <details className="mt-2">
                    <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                      View Explanation
                    </summary>
                    <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                      {result.contentQualityExplanation}
                    </p>
                  </details>
                )}
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Readability</h3>
                  </div>
                  <span className="text-3xl font-bold text-teal-600">{result.readabilityScore}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                  <div
                    className="bg-teal-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${result.readabilityScore}%` }}
                  />
                </div>
                {result.readabilityExplanation && (
                  <details className="mt-2">
                    <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                      View Explanation
                    </summary>
                    <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                      {result.readabilityExplanation}
                    </p>
                  </details>
                )}
            </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <h3 className="text-lg font-semibold text-gray-900">SEO</h3>
                  </div>
                  <span className="text-3xl font-bold text-teal-600">{result.seoScore}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                  <div
                    className="bg-teal-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${result.seoScore}%` }}
                  />
                </div>
                {result.seoExplanation && (
                  <details className="mt-2">
                    <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                      View Explanation
                    </summary>
                    <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                      {result.seoExplanation}
                    </p>
                  </details>
                )}
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="border-b border-gray-200 mb-8">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`${
                    activeTab === 'overview'
                      ? 'border-teal-500 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('engagement')}
                  className={`${
                    activeTab === 'engagement'
                      ? 'border-teal-500 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Engagement
                </button>
                <button
                  onClick={() => setActiveTab('writing')}
                  className={`${
                    activeTab === 'writing'
                      ? 'border-teal-500 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Writing Quality
                </button>
                <button
                  onClick={() => setActiveTab('keywords')}
                  className={`${
                    activeTab === 'keywords'
                      ? 'border-teal-500 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Keywords & Topics
                </button>
                <button
                  onClick={() => setActiveTab('insights')}
                  className={`${
                    activeTab === 'insights'
                      ? 'border-teal-500 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Insights
                </button>
                <button
                  onClick={() => setActiveTab('statistics')}
                  className={`${
                    activeTab === 'statistics'
                      ? 'border-teal-500 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Statistics
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="space-y-8">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Content Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center mb-2">
                          <h4 className="text-sm font-medium text-gray-500">Content Type</h4>
            </div>
                        <p className="text-lg text-gray-900">{result.contentType}</p>
                        {result.contentTypeExplanation && (
                          <details className="mt-2">
                            <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                              View Explanation
                            </summary>
                            <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                              {result.contentTypeExplanation}
                            </p>
                          </details>
                        )}
          </div>
                      <div>
                        <div className="flex items-center mb-2">
                          <h4 className="text-sm font-medium text-gray-500">Industry</h4>
                </div>
                        <p className="text-lg text-gray-900">{result.industry}</p>
                        {result.industryExplanation && (
                          <details className="mt-2">
                            <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                              View Explanation
                            </summary>
                            <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                              {result.industryExplanation}
                            </p>
                          </details>
                        )}
              </div>
                </div>
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center mb-2">
                          <h4 className="text-sm font-medium text-gray-500">Audience Level</h4>
              </div>
                        <p className="text-lg text-gray-900">{result.audienceLevel}</p>
                        {result.audienceLevelExplanation && (
                          <details className="mt-2">
                            <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                              View Explanation
                            </summary>
                            <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                              {result.audienceLevelExplanation}
                            </p>
                          </details>
                        )}
                </div>
                      <div>
                        <div className="flex items-center mb-2">
                          <h4 className="text-sm font-medium text-gray-500">Content Tone</h4>
              </div>
                        <p className="text-lg text-gray-900">{result.tone}</p>
                        {result.toneExplanation && (
                          <details className="mt-2">
                            <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                              View Explanation
                            </summary>
                            <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                              {result.toneExplanation}
                            </p>
                          </details>
                        )}
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Reading Time</h4>
                        <p className="text-lg text-gray-900">{result.estimatedReadTime} minutes</p>
                      </div>
                      <div>
                        <div className="flex items-center mb-2">
                          <h4 className="text-sm font-medium text-gray-500">Content Scope</h4>
                        </div>
                        <p className="text-lg text-gray-900">{result.scope}</p>
                        {result.scopeExplanation && (
                          <details className="mt-2">
                            <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                              View Explanation
                            </summary>
                            <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                              {result.scopeExplanation}
                            </p>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Engagement Tab */}
              {activeTab === 'engagement' && (
                <div className="space-y-8">
                  {/* Social Metrics */}
                  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Social Engagement</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-teal-100 rounded-lg flex items-center justify-center">
                            <svg className="h-6 w-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                </div>
                          <div className="ml-4">
                            <div className="flex items-center">
                              <p className="text-sm font-medium text-gray-500">Likes</p>
              </div>
                            <p className="text-lg font-semibold text-gray-900">{result.engagement.likes}</p>
                            {result.engagement.explanations?.likes && (
                              <details className="mt-2">
                                <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                                  View Explanation
                                </summary>
                                <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                                  {result.engagement.explanations.likes}
                                </p>
                              </details>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-teal-100 rounded-lg flex items-center justify-center">
                            <svg className="h-6 w-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                </div>
                          <div className="ml-4">
                            <div className="flex items-center">
                              <p className="text-sm font-medium text-gray-500">Comments</p>
              </div>
                            <p className="text-lg font-semibold text-gray-900">{result.engagement.comments}</p>
                            {result.engagement.explanations?.comments && (
                              <details className="mt-2">
                                <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                                  View Explanation
                                </summary>
                                <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                                  {result.engagement.explanations.comments}
                                </p>
                              </details>
                            )}
                </div>
              </div>
                </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-teal-100 rounded-lg flex items-center justify-center">
                            <svg className="h-6 w-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                </div>
                          <div className="ml-4">
                            <div className="flex items-center">
                              <p className="text-sm font-medium text-gray-500">Shares</p>
              </div>
                            <p className="text-lg font-semibold text-gray-900">{result.engagement.shares}</p>
                            {result.engagement.explanations?.shares && (
                              <details className="mt-2">
                                <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                                  View Explanation
                                </summary>
                                <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                                  {result.engagement.explanations.shares}
                                </p>
                              </details>
                            )}
            </div>
          </div>
            </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-teal-100 rounded-lg flex items-center justify-center">
                            <svg className="h-6 w-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
          </div>
                          <div className="ml-4">
                            <div className="flex items-center">
                              <p className="text-sm font-medium text-gray-500">Bookmarks</p>
                </div>
                            <p className="text-lg font-semibold text-gray-900">{result.engagement.bookmarks}</p>
                            {result.engagement.explanations?.bookmarks && (
                              <details className="mt-2">
                                <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                                  View Explanation
                                </summary>
                                <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                                  {result.engagement.explanations.bookmarks}
                                </p>
                              </details>
                            )}
            </div>
          </div>
                      </div>
                </div>
              </div>
              
                  {/* Traffic Metrics */}
                  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Traffic Analytics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                        <div className="flex items-center mb-2">
                          <h4 className="text-sm font-medium text-gray-500">Total Views</h4>
                </div>
                        <p className="text-2xl font-bold text-gray-900">{result.engagement.totalViews.toLocaleString()}</p>
                        {result.engagement.explanations?.totalViews && (
                          <details className="mt-2">
                            <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                              View Explanation
                            </summary>
                            <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                              {result.engagement.explanations.totalViews}
                            </p>
                          </details>
                        )}
                </div>
                      <div>
                        <div className="flex items-center mb-2">
                          <h4 className="text-sm font-medium text-gray-500">Unique Views</h4>
              </div>
                        <p className="text-2xl font-bold text-gray-900">{result.engagement.uniqueViews.toLocaleString()}</p>
                        {result.engagement.explanations?.uniqueViews && (
                          <details className="mt-2">
                            <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                              View Explanation
                            </summary>
                            <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                              {result.engagement.explanations.uniqueViews}
                            </p>
                          </details>
                        )}
                      </div>
              <div>
                        <div className="flex items-center mb-2">
                          <h4 className="text-sm font-medium text-gray-500">Avg. Time on Page</h4>
                </div>
                        <p className="text-2xl font-bold text-gray-900">{Math.floor(result.engagement.avgTimeOnPage / 60)}m {result.engagement.avgTimeOnPage % 60}s</p>
                        {result.engagement.explanations?.avgTimeOnPage && (
                          <details className="mt-2">
                            <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                              View Explanation
                            </summary>
                            <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                              {result.engagement.explanations.avgTimeOnPage}
                            </p>
                          </details>
                        )}
                </div>
              </div>
                    <div className="mt-6">
                      <div className="flex items-center mb-2">
                        <h4 className="text-sm font-medium text-gray-500">Bounce Rate</h4>
                </div>
                      <div className="flex items-center">
                        <div className="flex-grow">
                          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-teal-500 rounded-full"
                              style={{ width: `${result.engagement.bounceRate}%` }}
                            />
                </div>
              </div>
                        <span className="ml-4 text-sm font-medium text-gray-900">{result.engagement.bounceRate}%</span>
                      </div>
                      {result.engagement.explanations?.bounceRate && (
                        <details className="mt-2">
                          <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                            View Explanation
                          </summary>
                          <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                            {result.engagement.explanations.bounceRate}
                          </p>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Writing Quality Tab */}
              {activeTab === 'writing' && (
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Writing Quality Analysis</h3>
                  <div className="space-y-6">
              <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-500">Overall Quality</span>
                </div>
                        <span className="text-sm font-medium text-gray-900">{result.writingQuality.overall}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                        <div
                          className="bg-teal-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${result.writingQuality.overall}%` }}
                        />
                </div>
                      {result.writingQuality.explanations?.overall && (
                        <details className="mt-2">
                          <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                            View Explanation
                          </summary>
                          <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                            {result.writingQuality.explanations.overall}
                          </p>
                        </details>
                      )}
              </div>
              
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {Object.entries(result.writingQuality)
                        .filter(([key]) => key !== 'overall' && key !== 'explanations')
                        .map(([key, value]: [string, number | { [key: string]: string }]) => {
                          if (typeof value === 'number') {
                            return (
                              <div key={key} className="p-4 bg-white rounded-lg shadow">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-medium text-gray-500">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                                  <span className="text-sm font-medium text-gray-900">{value}%</span>
                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                                  <div
                                    className="bg-teal-600 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${value}%` }}
                                  />
                </div>
                                {result.writingQuality.explanations?.[key] && (
                                  <details className="mt-2">
                                    <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                                      View Explanation
                                    </summary>
                                    <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                                      {result.writingQuality.explanations[key]}
                                    </p>
                                  </details>
                                )}
              </div>
                            );
                          }
                          return null;
                        })}
            </div>
          </div>
            </div>
              )}

              {/* Keywords & Topics Tab */}
              {activeTab === 'keywords' && (
                <div className="space-y-8">
                  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Main Topics</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.topics.map((topic: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full text-sm font-medium"
                        >
                          {topic}
                    </span>
                ))}
            </div>
            </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Keyword Analysis</h3>
                    <div className="space-y-4">
                      <div className="mt-6 pt-6 border-t border-gray-100">
                        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                          Top Keywords
                          {result.keywordAnalysis && result.keywordAnalysis.explanation && (
                            <Tooltip content={result.keywordAnalysis.explanation} />
                          )}
                        </h3>
                        
                        {/* Debug information to help troubleshoot */}
                        <div className="mb-4 p-2 bg-gray-50 rounded text-xs text-gray-500">
                          Keywords data type: {result.keywords ? (Array.isArray(result.keywords) ? `Array (${result.keywords.length} items)` : typeof result.keywords) : 'undefined'}
                          {result.keywords && Array.isArray(result.keywords) && result.keywords.length > 0 && (
                            <div>
                              First keyword: {JSON.stringify(result.keywords[0])}
                            </div>
                          )}
                        </div>
                        
                        {result.keywords && Array.isArray(result.keywords) && result.keywords.length > 0 ? (
                          result.keywords.map((keyword, index) => {
                            // Handle both string keywords and object keywords
                            const keywordText = typeof keyword === 'string' 
                              ? keyword 
                              : (typeof keyword === 'object' && keyword !== null && 'text' in keyword) 
                                ? keyword.text 
                                : String(keyword);
                            
                            const keywordCount = typeof keyword === 'object' && keyword !== null && 'count' in keyword 
                              ? Number(keyword.count) 
                              : 1;
                            
                            if (index < 5) {
                              return (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                  <div className="flex items-center">
                                    <span className="w-8 h-8 flex items-center justify-center bg-teal-100 text-teal-800 rounded-full font-medium">
                                      {index + 1}
                                    </span>
                                    <span className="ml-3 text-gray-700 font-medium">{keywordText}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <span className="text-gray-500 text-sm mr-2">Occurrences:</span>
                                    <span className="text-gray-900 font-medium">{keywordCount}</span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })
                        ) : (
                          <div className="p-4 bg-gray-50 rounded-lg text-gray-500">
                            No keywords found. This could be due to insufficient content or an analysis issue.
                          </div>
                        )}
                      </div>
                      
                      {result.keywordAnalysis && (
                        <div className="mt-6 pt-6 border-t border-gray-100">
                          <h4 className="font-medium text-gray-700 mb-4">Keyword Distribution Analysis</h4>
                          <div className="space-y-4">
                            <div className="flex items-start">
                              <span className="flex-shrink-0 h-5 w-5 text-teal-500 mt-0.5">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </span>
                              <span className="ml-2 text-gray-700">
                                {typeof result.keywordAnalysis === 'object' && result.keywordAnalysis !== null && 'distribution' in result.keywordAnalysis 
                                  ? result.keywordAnalysis.distribution 
                                  : 'Keyword distribution analysis available'}
                              </span>
                            </div>
                            
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h5 className="font-medium text-gray-700 mb-3">Keyword Density</h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {result.keywords && Array.isArray(result.keywords) && result.keywords.length > 0 ? (
                                  result.keywords.map((keyword, index) => {
                                    if (index >= 8) return null;
                                    
                                    // Handle both string keywords and object keywords
                                    const keywordText = typeof keyword === 'string' 
                                      ? keyword 
                                      : (typeof keyword === 'object' && keyword !== null && 'text' in keyword) 
                                        ? keyword.text 
                                        : String(keyword);
                                    
                                    const keywordCount = typeof keyword === 'object' && keyword !== null && 'count' in keyword 
                                      ? Number(keyword.count) 
                                      : 1;
                                    
                                    // Calculate word length of keyword - safely handle potential null/undefined
                                    const keywordLength = typeof keywordText === 'string' ? keywordText.split(' ').length : 1;
                                    
                                    // Calculate density
                                    const totalWords = result.wordCountStats?.sum || 1000;
                                    const density = ((keywordCount * keywordLength) / totalWords * 100).toFixed(1);
                                    
                                    // Determine if keyword density is optimal
                                    const isDensityOptimal = parseFloat(density) >= 0.5 && parseFloat(density) <= 2.5;
                                    
                                    return (
                                      <div key={index} className="flex items-center">
                                        <div className="w-full">
                                          <div className="flex justify-between mb-1">
                                            <span className="text-sm font-medium text-gray-700">{keywordText}</span>
                                            <span className={`text-xs font-medium ${isDensityOptimal ? 'text-green-600' : 'text-amber-600'}`}>
                                              {density}%
                                            </span>
                                          </div>
                                          <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                              className={`h-2 rounded-full ${isDensityOptimal ? 'bg-green-500' : 'bg-amber-500'}`}
                                              style={{ width: `${Math.min(parseFloat(density) * 10, 100)}%` }}
                                            ></div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <div className="col-span-2 text-gray-500 text-sm">No keyword data available</div>
                                )}
                              </div>
                            </div>
                            
                            {typeof result.keywordAnalysis === 'object' && result.keywordAnalysis !== null && 'overused' in result.keywordAnalysis && 
                             result.keywordAnalysis.overused && result.keywordAnalysis.overused.length > 0 && (
                              <div className="flex items-start">
                                <span className="flex-shrink-0 h-5 w-5 text-amber-500 mt-0.5">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                </span>
                                <div className="ml-2">
                                  <p className="text-gray-700 font-medium">Overused Keywords:</p>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {result.keywordAnalysis.overused.map((keyword, idx) => (
                                      <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                        {keyword}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {typeof result.keywordAnalysis === 'object' && result.keywordAnalysis !== null && 'underused' in result.keywordAnalysis && 
                             result.keywordAnalysis.underused && result.keywordAnalysis.underused.length > 0 && (
                              <div className="flex items-start mt-3">
                                <span className="flex-shrink-0 h-5 w-5 text-blue-500 mt-0.5">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                                  </svg>
                                </span>
                                <div className="ml-2">
                                  <p className="text-gray-700 font-medium">Suggested Keywords:</p>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {result.keywordAnalysis.underused.map((keyword, idx) => (
                                      <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        <svg className="mr-1 h-2 w-2" fill="currentColor" viewBox="0 0 8 8">
                                          <path d="M4 0v3h3v2h-3v3h-2v-3h-3v-2h3v-3h2z" />
                                        </svg>
                                        {keyword}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Insights Tab */}
              {activeTab === 'insights' && (
                <div className="space-y-8">
                  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Content Insights</h3>
                    <div className="space-y-6">
                      {result.insights.content.map((insight: string, index: number) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-start">
                            <div className="flex-shrink-0 h-6 w-6 text-teal-500 mt-1">
                              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <p className="text-gray-700 whitespace-pre-line">{insight}</p>
                              <div className="mt-2 flex">
                                <button 
                                  className="text-xs text-teal-600 hover:text-teal-800 flex items-center"
                                  onClick={() => navigator.clipboard.writeText(insight)}
                                >
                                  <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                  </svg>
                                  Copy insight
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {result.insights.content.length === 0 && (
                        <div className="text-center py-4 text-gray-500">
                          No content insights available for this article.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">SEO Insights</h3>
                    <div className="space-y-6">
                      {result.insights.seo.map((insight: string, index: number) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-start">
                            <div className="flex-shrink-0 h-6 w-6 text-teal-500 mt-1">
                              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <p className="text-gray-700 whitespace-pre-line">{insight}</p>
                              <div className="mt-2 flex">
                                <button 
                                  className="text-xs text-teal-600 hover:text-teal-800 flex items-center"
                                  onClick={() => navigator.clipboard.writeText(insight)}
                                >
                                  <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                  </svg>
                                  Copy insight
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {result.insights.seo.length === 0 && (
                        <div className="text-center py-4 text-gray-500">
                          No SEO insights available for this article.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Engagement Insights</h3>
                    <div className="space-y-6">
                      {result.insights.engagement.map((insight: string, index: number) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-start">
                            <div className="flex-shrink-0 h-6 w-6 text-teal-500 mt-1">
                              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <p className="text-gray-700 whitespace-pre-line">{insight}</p>
                              <div className="mt-2 flex">
                                <button 
                                  className="text-xs text-teal-600 hover:text-teal-800 flex items-center"
                                  onClick={() => navigator.clipboard.writeText(insight)}
                                >
                                  <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                  </svg>
                                  Copy insight
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {result.insights.engagement.length === 0 && (
                        <div className="text-center py-4 text-gray-500">
                          No engagement insights available for this article.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Readability Insights</h3>
                    <div className="space-y-6">
                      {result.insights.readability.map((insight: string, index: number) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-start">
                            <div className="flex-shrink-0 h-6 w-6 text-teal-500 mt-1">
                              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <p className="text-gray-700 whitespace-pre-line">{insight}</p>
                              <div className="mt-2 flex">
                                <button 
                                  className="text-xs text-teal-600 hover:text-teal-800 flex items-center"
                                  onClick={() => navigator.clipboard.writeText(insight)}
                                >
                                  <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                  </svg>
                                  Copy insight
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {result.insights.readability.length === 0 && (
                        <div className="text-center py-4 text-gray-500">
                          No readability insights available for this article.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Statistics Tab */}
              {activeTab === 'statistics' && (
                <div className="space-y-8">
                  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Content Statistics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Word Count</h4>
                        <p className="text-2xl font-bold text-gray-900">{result.wordCountStats.sum}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {result.estimatedReadTime} minute{result.estimatedReadTime !== 1 ? 's' : ''} read
                        </p>
                        {result.wordCountStats.explanations?.sum && (
                          <details className="mt-2">
                            <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                              View Analysis
                            </summary>
                            <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                              {result.wordCountStats.explanations.sum}
                            </p>
                          </details>
                        )}
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Content Type</h4>
                        <p className="text-2xl font-bold text-gray-900">{result.contentType}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {result.industry} / {result.scope}
                        </p>
                        {result.contentTypeExplanation && (
                          <details className="mt-2">
                            <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                              View Analysis
                            </summary>
                            <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                              {result.contentTypeExplanation}
                            </p>
                          </details>
                        )}
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Audience Level</h4>
                        <p className="text-2xl font-bold text-gray-900">{result.audienceLevel}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Tone: {result.tone}
                        </p>
                        {result.audienceLevelExplanation && (
                          <details className="mt-2">
                            <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                              View Analysis
                            </summary>
                            <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                              {result.audienceLevelExplanation}
                            </p>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Content Structure</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Paragraph Analysis</h4>
                        <div className="flex items-center mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-teal-600 h-2.5 rounded-full" style={{ width: `${result.writingQuality.overall}%` }}></div>
                          </div>
                          <span className="ml-2 text-sm font-medium text-gray-700">{result.writingQuality.overall}%</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-3">
                          Structure score based on paragraph organization and flow
                        </p>
                        {result.writingQuality.explanations?.overall && (
                          <details className="mt-2">
                            <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                              View Analysis
                            </summary>
                            <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                              {result.writingQuality.explanations.overall}
                            </p>
                          </details>
                        )}
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Keyword Distribution</h4>
                        {result.keywordAnalysis && result.keywordAnalysis.distribution && (
                          <>
                            <p className="text-lg font-semibold text-gray-900">{result.keywordAnalysis.distribution}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              {result.keywordAnalysis.overused.length > 0 ? 
                                `${result.keywordAnalysis.overused.length} overused keywords` : 
                                'No overused keywords'}
                            </p>
                            {result.keywordAnalysis.explanation && (
                              <details className="mt-2">
                                <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                                  View Analysis
                                </summary>
                                <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                                  {result.keywordAnalysis.explanation}
                                </p>
                              </details>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Publication Timeline</h3>
                    <div className="space-y-4">
                      {result.articlesPerMonth.map((month) => (
                        <div key={month.date} className="flex items-center">
                          <div className="flex-shrink-0 w-24">
                            <span className="text-sm font-medium text-gray-500">{month.date}</span>
                          </div>
                          <div className="ml-4 flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              Published on {new Date(month.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* No URLs Message */}
        {!isLoadingUrls && selectedUrls.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Content Analysis Yet</h3>
            <p className="mt-2 text-gray-500">
              Get started by entering a URL above or visit the{' '}
              <a href="/urls" className="text-teal-600 hover:text-teal-500 font-medium">
                URLs page
              </a>{' '}
              to manage your content sources.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}; 