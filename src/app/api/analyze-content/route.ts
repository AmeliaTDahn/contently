import { type NextRequest } from 'next/server';
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
}

export interface ArticleByMonth {
  date: string;
  count: number;
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
    wordCountStats: {
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
    };
    articlesPerMonth: Array<{
      date: string;
      count: number;
      explanation?: string;
    }>;
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

export async function POST(request: NextRequest): Promise<Response> {
  let urlRecord: UrlRecord | undefined;
  
  try {
    const body = await request.json() as RequestBody;
    
    if (!body.url || typeof body.url !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid URL provided' }),
        { status: 400 }
      );
    }

    // Create URL record
    const [record] = await db
      .insert(analyzedUrls)
      .values({
        url: body.url,
        status: 'processing'
      })
      .returning();
    
    if (!record) {
      throw new Error('Failed to create URL record');
    }
    
    urlRecord = record;

    // Scrape content
    const scrapingResult = await scrapePuppeteer(body.url);
    
    if (scrapingResult.error || !scrapingResult.content) {
      throw new Error(scrapingResult.error?.message || 'Failed to scrape content');
    }

    const { mainContent } = scrapingResult.content;
    const { title = '', description = '', keywords = [], author = '' } = scrapingResult.content.metadata;

    // Analyze content
    const analysis = await analyzeContent(mainContent, title);

    const aiAnalysis = await analyzeContentWithAI({
      content: mainContent,
      title,
      metadata: {
        description,
        keywords: Array.isArray(keywords) ? keywords : keywords.split(',').map(k => k.trim()),
        author
      }
    });

    const engagementPredictions = await predictEngagementMetrics(
      mainContent,
      {
        engagementScore: aiAnalysis.engagementScore,
        contentQualityScore: aiAnalysis.contentQualityScore,
        readabilityScore: aiAnalysis.readabilityScore,
        seoScore: aiAnalysis.seoScore,
        industry: aiAnalysis.industry,
        topics: aiAnalysis.topics,
        audienceLevel: aiAnalysis.audienceLevel,
        contentType: aiAnalysis.contentType,
        tone: aiAnalysis.tone
      }
    );
    
    // Calculate word count stats
    const wordCount = mainContent.trim().split(/\s+/).length;
    
    // Combine analyses and ensure required fields
    const combinedAnalysis = {
      analyzedUrlId: record.id,
      engagementScore: aiAnalysis.engagementScore || 0,
      engagementExplanation: aiAnalysis.engagementExplanation,
      contentQualityScore: aiAnalysis.contentQualityScore || 0,
      contentQualityExplanation: aiAnalysis.contentQualityExplanation,
      readabilityScore: aiAnalysis.readabilityScore || 0,
      readabilityExplanation: aiAnalysis.readabilityExplanation,
      seoScore: aiAnalysis.seoScore || 0,
      seoExplanation: aiAnalysis.seoExplanation,
      industry: aiAnalysis.industry || 'General',
      industryExplanation: aiAnalysis.industryExplanation,
      scope: aiAnalysis.scope || 'General',
      scopeExplanation: aiAnalysis.scopeExplanation,
      topics: aiAnalysis.topics || [],
      topicsExplanation: aiAnalysis.topicsExplanation,
      writingQuality: aiAnalysis.writingQuality || {
        grammar: 0,
        clarity: 0,
        structure: 0,
        vocabulary: 0,
        overall: 0
      },
      audienceLevel: aiAnalysis.audienceLevel || 'General',
      audienceLevelExplanation: aiAnalysis.audienceLevelExplanation,
      contentType: aiAnalysis.contentType || 'Article',
      contentTypeExplanation: aiAnalysis.contentTypeExplanation,
      tone: aiAnalysis.tone || 'Neutral',
      toneExplanation: aiAnalysis.toneExplanation,
      estimatedReadTime: Math.ceil(wordCount / 200), // Assuming 200 words per minute
      keywords: aiAnalysis.keywords || [],
      keywordAnalysis: aiAnalysis.keywordAnalysis || {
        distribution: '',
        overused: [],
        underused: []
      },
      insights: aiAnalysis.insights || {
        engagement: [],
        content: [],
        readability: [],
        seo: []
      },
      wordCountStats: {
        count: wordCount,
        min: wordCount,
        max: wordCount,
        avg: wordCount,
        sum: wordCount
      },
      articlesPerMonth: [{
        date: new Date().toISOString().slice(0, 7),
        count: 1
      }],
      engagement: engagementPredictions || {
        likes: 0,
        comments: 0,
        shares: 0,
        bookmarks: 0,
        totalViews: 0,
        uniqueViews: 0,
        avgTimeOnPage: 0,
        bounceRate: 0,
        socialShares: {
          facebook: 0,
          twitter: 0,
          linkedin: 0,
          pinterest: 0
        }
      }
    };

    // Save analytics
    await db.insert(contentAnalytics).values(combinedAnalysis);

    // Update URL status
    await db
      .update(analyzedUrls)
      .set({ 
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(analyzedUrls.id, record.id));

    return new Response(
      JSON.stringify(combinedAnalysis),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error analyzing content:', error);
    
    // Update URL status to failed if we have a record
    if (urlRecord) {
      await db
        .update(analyzedUrls)
        .set({ 
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          updatedAt: new Date()
        })
        .where(eq(analyzedUrls.id, urlRecord.id));
    }
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to analyze content'
      }),
      { status: 500 }
    );
  }
} 