"use client";

import { useState } from "react";

interface AnalyticsResult {
  readability: {
    score: number;
    level: string;
    analysis: string;
  };
  seoAnalysis: {
    titleScore: number;
    titleAnalysis: string;
    keywordDensity: Record<string, number>;
    metaDescription: {
      score: number;
      analysis: string;
    };
  };
  contentQuality: {
    score: number;
    strengths: string[];
    improvements: string[];
    wordCount: number;
    averageSentenceLength: number;
    paragraphCount: number;
  };
  topicAnalysis: {
    score: number;
    mainTopics: string[];
    coherence: string;
    titleTopicAlignment: string;
  };
  engagement: {
    score: number;
    analysis: string;
    hooks: string[];
    callToActions: string[];
    metrics: {
      likes: number;
      comments: number;
      shares: number;
      views: number;
      totalInteractions: number;
      engagementRate: number;
    };
    insights: string[];
  };
}

export default function ContentAnalytics() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResult | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      setError("Please enter a URL");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setAnalytics(null);
    
    try {
      const response = await fetch("/api/analyze-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze content");
      }
      
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const ScoreIndicator = ({ score }: { score: number }) => (
    <div className="flex items-center space-x-2">
      <div className="w-full h-2 bg-gray-200 rounded-full">
        <div 
          className={`h-2 rounded-full ${
            score >= 80 ? 'bg-green-500' :
            score >= 60 ? 'bg-yellow-500' :
            'bg-red-500'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-sm font-medium">{score}%</span>
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl p-8 mb-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Analyze Your Content</h2>
        <p className="text-gray-600 mb-6">Enter a URL to get detailed insights about your content's quality, readability, and engagement metrics.</p>
        
        <form onSubmit={handleAnalyze} className="space-y-4">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
              Content URL
            </label>
            <div className="flex gap-4">
              <input
                type="url"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/blog-post"
                className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent shadow-sm"
              />
              <button
                type="submit"
                disabled={isLoading}
                className={`px-6 py-3 rounded-lg font-medium flex items-center justify-center shadow-sm ${
                  isLoading
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-teal-600 text-white hover:bg-teal-700"
                } transition-colors`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Analyze
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-8 flex items-start">
          <svg className="h-5 w-5 text-red-400 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>{error}</p>
        </div>
      )}

      {analytics && (
        <div className="space-y-8">
          {/* Summary Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-6 shadow-sm order-1">
              <h4 className="text-sm font-medium text-pink-800 mb-4">Engagement Score</h4>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-pink-700">{analytics.engagement.score}%</div>
                <div className="h-12 w-12 rounded-full bg-pink-200/50 flex items-center justify-center">
                  <svg className="h-6 w-6 text-pink-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-6 shadow-sm order-2">
              <h4 className="text-sm font-medium text-teal-800 mb-4">Content Quality</h4>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-teal-700">{analytics.contentQuality.score}%</div>
                <div className="h-12 w-12 rounded-full bg-teal-200/50 flex items-center justify-center">
                  <svg className="h-6 w-6 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 shadow-sm order-3">
              <h4 className="text-sm font-medium text-blue-800 mb-4">Readability</h4>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-blue-700">{analytics.readability.score}%</div>
                <div className="h-12 w-12 rounded-full bg-blue-200/50 flex items-center justify-center">
                  <svg className="h-6 w-6 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 shadow-sm order-4">
              <h4 className="text-sm font-medium text-purple-800 mb-4">SEO Score</h4>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-purple-700">{analytics.seoAnalysis.titleScore}%</div>
                <div className="h-12 w-12 rounded-full bg-purple-200/50 flex items-center justify-center">
                  <svg className="h-6 w-6 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Engagement Analysis */}
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">Engagement Analysis</h3>
                <p className="text-gray-600 mt-1">Real-time engagement metrics and insights</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-500">Views</div>
                  <div className="h-8 w-8 rounded-full bg-gray-200/50 flex items-center justify-center">
                    <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{analytics.engagement.metrics.views.toLocaleString()}</div>
              </div>
              
              <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-4 border border-pink-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-pink-700">Likes</div>
                  <div className="h-8 w-8 rounded-full bg-pink-200/50 flex items-center justify-center">
                    <svg className="h-4 w-4 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                </div>
                <div className="text-2xl font-bold text-pink-700">{analytics.engagement.metrics.likes.toLocaleString()}</div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-blue-700">Comments</div>
                  <div className="h-8 w-8 rounded-full bg-blue-200/50 flex items-center justify-center">
                    <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                </div>
                <div className="text-2xl font-bold text-blue-700">{analytics.engagement.metrics.comments.toLocaleString()}</div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-green-700">Shares</div>
                  <div className="h-8 w-8 rounded-full bg-green-200/50 flex items-center justify-center">
                    <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </div>
                </div>
                <div className="text-2xl font-bold text-green-700">{analytics.engagement.metrics.shares.toLocaleString()}</div>
              </div>
            </div>

            {/* Engagement Performance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg p-6 border border-pink-200">
                <h4 className="text-lg font-medium text-gray-900 mb-2">Total Interactions</h4>
                <div className="text-3xl font-bold text-pink-700 mb-2">
                  {analytics.engagement.metrics.totalInteractions.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Combined likes, comments, and shares</div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
                <h4 className="text-lg font-medium text-gray-900 mb-2">Engagement Rate</h4>
                <div className="text-3xl font-bold text-purple-700 mb-2">
                  {analytics.engagement.metrics.engagementRate.toFixed(2)}%
                </div>
                <div className="text-sm text-gray-600">Percentage of viewers who interacted</div>
              </div>
            </div>

            {/* Engagement Insights */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-200">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Key Insights</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analytics.engagement.insights.map((insight, index) => (
                  <div key={index} className="flex items-start bg-white rounded-lg p-4 border border-gray-200">
                    <svg className="h-5 w-5 text-purple-600 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-gray-700">{insight}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Content Engagement Elements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
              <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-6 border border-pink-200">
                <h4 className="flex items-center text-lg font-medium text-gray-900 mb-4">
                  <svg className="h-5 w-5 text-pink-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                  Engagement Hooks
                </h4>
                <div className="space-y-3">
                  {analytics.engagement.hooks.map((hook, index) => (
                    <div key={index} className="bg-white rounded-lg p-3 text-gray-700 border border-pink-200">
                      {hook}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
                <h4 className="flex items-center text-lg font-medium text-gray-900 mb-4">
                  <svg className="h-5 w-5 text-purple-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                  Calls to Action
                </h4>
                <div className="space-y-3">
                  {analytics.engagement.callToActions.map((cta, index) => (
                    <div key={index} className="bg-white rounded-lg p-3 text-gray-700 border border-purple-200">
                      {cta}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Content Quality Analysis */}
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Content Quality Analysis</h3>
              <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-500 mb-1">Word Count</div>
                <div className="text-2xl font-bold text-gray-900">{analytics.contentQuality.wordCount}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-500 mb-1">Avg. Sentence Length</div>
                <div className="text-2xl font-bold text-gray-900">{analytics.contentQuality.averageSentenceLength}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-500 mb-1">Paragraphs</div>
                <div className="text-2xl font-bold text-gray-900">{analytics.contentQuality.paragraphCount}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="flex items-center text-green-700 font-medium mb-4">
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Content Strengths
                </h4>
                <ul className="space-y-3">
                  {analytics.contentQuality.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start bg-green-50 rounded-lg p-3">
                      <svg className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-gray-700">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="flex items-center text-yellow-700 font-medium mb-4">
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Areas for Improvement
                </h4>
                <ul className="space-y-3">
                  {analytics.contentQuality.improvements.map((improvement, index) => (
                    <li key={index} className="flex items-start bg-yellow-50 rounded-lg p-3">
                      <svg className="h-5 w-5 text-yellow-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="text-sm text-gray-700">{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Topic Analysis */}
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Topic Analysis</h3>
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600">Topic Relevance Score</span>
                <ScoreIndicator score={analytics.topicAnalysis.score} />
              </div>
              <p className="text-sm text-gray-600 bg-purple-50 rounded-lg p-4 border border-purple-100">
                {analytics.topicAnalysis.titleTopicAlignment}
              </p>
            </div>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Main Topics</h4>
                <div className="flex flex-wrap gap-2">
                  {analytics.topicAnalysis.mainTopics.map((topic, index) => (
                    <span key={index} className="px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium border border-purple-200">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Topic Coherence</h4>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-4">
                  {analytics.topicAnalysis.coherence}
                </p>
              </div>
            </div>
          </div>

          {/* Readability Analysis */}
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Readability Analysis</h3>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">Readability Score</span>
                  <ScoreIndicator score={analytics.readability.score} />
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <p className="text-sm font-medium text-blue-800 mb-2">
                    Reading Level: {analytics.readability.level}
                  </p>
                  <p className="text-sm text-gray-600">{analytics.readability.analysis}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 