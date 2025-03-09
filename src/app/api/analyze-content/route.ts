import { NextResponse } from 'next/server';
import { scrapePuppeteer } from '@/utils/scrapers/puppeteerScraper';
import { analyzeKeywordUsage } from '@/utils/keywords';
import { analyzeTopicCoherence } from '@/utils/topics';
import { analyzeContent, type ContentAnalysisResult } from '@/utils/contentAnalysis';
import { db } from '@/server/db';
import { analyzedUrls, contentAnalytics } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { analyzeContentWithAI, predictEngagementMetrics } from '@/utils/openai';

interface RequestBody {
  url: string;
}

export interface WritingQuality {
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

export interface Insights {
  engagement: string[];
  content: string[];
  readability: string[];
  seo: string[];
}

export interface KeywordAnalysis {
  distribution: string;
  overused: string[];
  underused: string[];
  explanation?: string;
}

export interface Keyword {
  text: string;
  count: number;
}

export interface WordCountStats {
  count: number;
  min: number;
  max: number;
  avg: number;
  sum: number;
  explanations?: {
    count: string;
    min: string;
    max: string;
    avg: string;
    sum: string;
  };
}

export interface ArticleByMonth {
  date: string;
  count: number;
  explanation?: string;
}

export interface EngagementMetrics {
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

export interface AnalyticsResult {
  engagementScore: number;
  engagementExplanation?: string;
  contentQualityScore: number;
  contentQualityExplanation?: string;
  readabilityScore: number;
  readabilityExplanation?: string;
  seoScore: number;
  seoExplanation?: string;
  insights: Insights;
  industry: string;
  industryExplanation?: string;
  scope: string;
  scopeExplanation?: string;
  topics: string[];
  topicsExplanation?: string;
  writingQuality: WritingQuality;
  audienceLevel: string;
  audienceLevelExplanation?: string;
  contentType: string;
  contentTypeExplanation?: string;
  tone: string;
  toneExplanation?: string;
  estimatedReadTime: number;
  keywords: Keyword[];
  keywordAnalysis: KeywordAnalysis;
  engagement: EngagementMetrics;
  stats: {
    wordCountStats: WordCountStats;
    articlesPerMonth: ArticleByMonth[];
  };
}

export interface ExtendedAnalytics {
  currentArticle: AnalyticsResult;
  stats: {
    wordCountStats: WordCountStats;
    articlesPerMonth: ArticleByMonth[];
  };
}

interface UrlRecord {
  id: number;
  url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage: string | null;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date | null;
  completedAt: Date | null;
}

// Helper function to cap scores at 100
function capScore(score: number): number {
  return Math.min(Math.round(score), 100);
}

// [FAKE] Unused placeholder data generator - not currently used in main flow
function generateFakeKeywords(): Keyword[] {
  const commonKeywords = [
    { text: "digital marketing", count: Math.floor(Math.random() * 8) + 3 },
    { text: "content strategy", count: Math.floor(Math.random() * 6) + 2 },
    { text: "social media", count: Math.floor(Math.random() * 7) + 4 },
    { text: "brand awareness", count: Math.floor(Math.random() * 5) + 2 },
    { text: "target audience", count: Math.floor(Math.random() * 6) + 3 },
    { text: "engagement", count: Math.floor(Math.random() * 8) + 5 },
    { text: "analytics", count: Math.floor(Math.random() * 4) + 2 },
    { text: "conversion rate", count: Math.floor(Math.random() * 5) + 2 },
    { text: "optimization", count: Math.floor(Math.random() * 6) + 3 },
    { text: "content marketing", count: Math.floor(Math.random() * 7) + 4 }
  ];
  return commonKeywords.sort(() => Math.random() - 0.5).slice(0, 6);
}

// [FAKE] Unused placeholder data generator - not currently used in main flow
function generateFakeTopics(): string[] {
  const topics = [
    "Content Marketing Strategy",
    "Social Media Engagement",
    "Digital Marketing Trends",
    "Brand Development",
    "Marketing Analytics",
    "Customer Journey",
    "SEO Optimization",
    "Lead Generation",
    "Marketing Automation",
    "Content Creation"
  ];
  return topics.sort(() => Math.random() - 0.5).slice(0, 3);
}

// [FAKE] Unused placeholder data generator - not currently used in main flow
function generateFakeArticlesPerMonth(): ArticleByMonth[] {
  const months: ArticleByMonth[] = [];
  const currentDate = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    months.push({
      date: date.toISOString().split('T')[0] as string,
      count: Math.floor(Math.random() * 8) + 2
    });
  }
  
  return months;
}

// [FAKE] Unused placeholder data generator - not currently used in main flow
function generateFakeWordCountStats(): WordCountStats {
  const counts = Array.from({ length: 20 }, () => Math.floor(Math.random() * 1000) + 500);
  return {
    count: counts.length,
    min: Math.min(...counts),
    max: Math.max(...counts),
    avg: Math.round(counts.reduce((a, b) => a + b, 0) / counts.length),
    sum: counts.reduce((a, b) => a + b, 0)
  };
}

// [FAKE] Unused placeholder data generator - not currently used in main flow
function generateFakeEngagementMetrics(): EngagementMetrics {
  return {
    likes: Math.floor(Math.random() * 200) + 50,
    comments: Math.floor(Math.random() * 50) + 10,
    shares: Math.floor(Math.random() * 100) + 20,
    bookmarks: Math.floor(Math.random() * 50) + 5,
    totalViews: Math.floor(Math.random() * 2000) + 500,
    uniqueViews: Math.floor(Math.random() * 1500) + 300,
    avgTimeOnPage: Math.floor(Math.random() * 300) + 120, // in seconds
    bounceRate: Math.floor(Math.random() * 30) + 20, // percentage
    socialShares: {
      facebook: Math.floor(Math.random() * 50) + 10,
      twitter: Math.floor(Math.random() * 40) + 5,
      linkedin: Math.floor(Math.random() * 30) + 5,
      pinterest: Math.floor(Math.random() * 20) + 2
    }
  };
}

// Add these helper functions for real statistics calculation
function calculateWordCount(text: string): number {
  return text.trim().split(/\s+/).length;
}

function calculateReadingTime(wordCount: number): number {
  // Average reading speed is about 200-250 words per minute
  const wordsPerMinute = 225;
  return Math.ceil(wordCount / wordsPerMinute);
}

function getWordCountStats(content: string, existingStats?: WordCountStats): WordCountStats {
  const currentWordCount = calculateWordCount(content);
  
  if (!existingStats) {
    return {
      count: 1,
      min: currentWordCount,
      max: currentWordCount,
      avg: currentWordCount,
      sum: currentWordCount
    };
  }

  const newCount = existingStats.count + 1;
  const newSum = existingStats.sum + currentWordCount;
  
  return {
    count: newCount,
    min: Math.min(existingStats.min, currentWordCount),
    max: Math.max(existingStats.max, currentWordCount),
    avg: newSum / newCount,
    sum: newSum
  };
}

// Set timeout for the entire analysis process
const ANALYSIS_TIMEOUT = 120000; // 120 seconds

export const runtime = 'edge';
export const maxDuration = 300;

export async function POST(req: Request) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 290000); // Abort just before Vercel's timeout

  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    console.log('Analyzing URL:', url);
    const scrapedResult = await scrapePuppeteer(url);

    if (scrapedResult.error) {
      console.error('Error scraping URL:', scrapedResult.error);
      return NextResponse.json(
        { error: scrapedResult.error.message },
        { status: 500 }
      );
    }

    if (!scrapedResult.content) {
      return NextResponse.json(
        { error: 'No content found in the scraped result' },
        { status: 400 }
      );
    }

    // Analyze the content using OpenAI with timeout
    const analysis = await Promise.race([
      analyzeContentWithAI({
        content: scrapedResult.content.mainContent || '',
        title: scrapedResult.content.metadata.title || '',
        metadata: {
          description: scrapedResult.content.metadata.description || '',
          keywords: scrapedResult.content.metadata.keywords || [],
          author: scrapedResult.content.metadata.author || ''
        }
      }),
      new Promise<Partial<AnalyticsResult>>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Content analysis timed out. Please try again with a shorter article.'));
        }, 280000); // Timeout before Vercel's limit
      })
    ]);

    // Get engagement predictions using the analysis results
    const engagement = await Promise.race([
      predictEngagementMetrics(
        scrapedResult.content.mainContent || '',
        analysis as Partial<AnalyticsResult>
      ),
      new Promise<EngagementMetrics>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Engagement prediction timed out. Please try again.'));
        }, 30000);
      })
    ]);

    // Combine all results
    const result = {
      data: {
        currentArticle: {
          ...(analysis as Partial<AnalyticsResult>),
          engagement
        },
        stats: (analysis as Partial<AnalyticsResult>).stats || {
          wordCountStats: {
            count: 0,
            min: 0,
            max: 0,
            avg: 0,
            sum: 0
          },
          articlesPerMonth: []
        }
      }
    };

    clearTimeout(timeoutId);
    return NextResponse.json(result);
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Error in analyze-content route:', error);
    
    // Handle different types of errors
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'The request took too long to process. Please try again with a shorter article.' },
          { status: 408 }
        );
      }
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 