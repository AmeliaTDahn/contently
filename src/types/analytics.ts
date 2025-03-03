export interface WordCountStats {
  count: number;
  min: number;
  max: number;
  avg: number;
  sum: number;
}

export interface ArticlesByMonth {
  date: string;
  count: number;
}

export interface ArticleStats {
  wordCountStats: WordCountStats;
  articlesPerMonth: ArticlesByMonth[];
}

export interface ArticleDetails {
  id: string;
  wordCount: number;
  keywords: string[];
  createdAt: string;
  title: string;
  url: string;
  author?: string;
}

export interface ArticleCollection {
  total: number;
  articles: ArticleDetails[];
  urlPatterns: string[];
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
}

export interface ExtendedAnalytics {
  currentArticle: {
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
    industry: string;
    scope: string;
    topics: string[];
    writingQuality: {
      grammar: number;
      clarity: number;
      structure: number;
      vocabulary: number;
      overall: number;
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
    };
    engagement: EngagementMetrics;
  };
  stats: ArticleStats;
  articles: ArticleCollection;
}

export interface AnalyticsResult {
  currentArticle: {
    engagementScore: number;
    engagementExplanation?: string;
    contentQualityScore: number;
    contentQualityExplanation?: string;
    readabilityScore: number;
    readabilityExplanation?: string;
    seoScore: number;
    seoExplanation?: string;
    insights: string[];
    industry: string;
    industryExplanation?: string;
    scope: string;
    scopeExplanation?: string;
    topics: string[];
    topicsExplanation?: string;
    writingQuality: string;
    audienceLevel: string;
    audienceLevelExplanation?: string;
    contentType: string;
    contentTypeExplanation?: string;
    tone: string;
    toneExplanation?: string;
    estimatedReadTime: number;
    keywords: string[];
    keywordAnalysis: string[];
    engagement: string[];
    stats: {
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
    };
  };
  stats: {
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
  };
} 