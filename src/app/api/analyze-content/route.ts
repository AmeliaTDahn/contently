import { type NextRequest } from 'next/server';
import { scrapePlaywright } from '@/utils/scrapers/playwrightScraper';
import { analyzeKeywordUsage } from '@/utils/keywords';
import { analyzeTopicCoherence, extractMainTopics } from '@/utils/topics';
import { analyzeContent, type ContentAnalysisResult } from '@/utils/contentAnalysis';
import { db } from '@/server/db';
import { analyzedUrls, contentAnalytics } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { analyzeContentWithAI, predictEngagementMetrics } from '@/utils/openai';
import { config, apiConfig } from '../config';

// Export the config for edge runtime
export { config };

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
  topicCoherence: string;
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

// Helper function to implement timeout
const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Operation timed out')), timeoutMs);
  });

  return Promise.race([promise, timeout]);
};

// Helper function to implement retries
const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = apiConfig.maxRetries,
  delay: number = apiConfig.retryDelay
): Promise<T> => {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError || new Error('Operation failed after retries');
};

export async function POST(request: NextRequest): Promise<Response> {
  let urlRecord: typeof analyzedUrls.$inferSelect | undefined;

  try {
    const body = (await request.json()) as RequestBody;

    if (!body.url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400 }
      );
    }

    // Check if URL has already been analyzed
    const existingUrl = await withTimeout(
      db
        .select()
        .from(analyzedUrls)
        .where(eq(analyzedUrls.url, body.url))
        .limit(1),
      apiConfig.maxTimeout
    );

    if (existingUrl.length > 0) {
      urlRecord = existingUrl[0];
      
      if (urlRecord?.status === 'completed') {
        // Fetch existing analytics
        const analytics = await withTimeout(
          db
            .select()
            .from(contentAnalytics)
            .where(eq(contentAnalytics.analyzedUrlId, urlRecord.id))
            .limit(1),
          apiConfig.maxTimeout
        );

        if (analytics.length > 0) {
          return new Response(
            JSON.stringify(analytics[0]),
            { status: 200 }
          );
        }
      }
    }

    // Create new URL record
    urlRecord = (await withTimeout(
      db
        .insert(analyzedUrls)
        .values({
            url: body.url,
            status: 'processing'
        })
        .returning(),
      apiConfig.maxTimeout
    ))[0];

    if (!urlRecord) {
      return new Response(
        JSON.stringify({ error: 'Failed to create URL record' }),
        { status: 500 }
      );
    }

    const recordId = urlRecord.id;

    try {
      // Scrape the content with retries
      const scrapedData = await withRetry(
        () => withTimeout(scrapePlaywright(body.url), apiConfig.maxTimeout)
      );
      
      if (!scrapedData.content || scrapedData.error) {
        throw new Error(scrapedData.error?.message || 'Failed to scrape content');
      }

      const { content } = scrapedData;

      // Analyze content with various tools
      const [contentAnalysis, keywordAnalysis, topicCoherence, mainTopics] = await Promise.all([
        withTimeout(analyzeContent(content.mainContent, content.metadata.title || ''), apiConfig.maxTimeout),
        Promise.resolve(analyzeKeywordUsage(content.mainContent, [])),
        Promise.resolve(analyzeTopicCoherence(content.mainContent, content.metadata.title || '')),
        Promise.resolve(extractMainTopics(content.mainContent))
      ]);

      // Get AI-powered analysis with retries
      const aiAnalysis = await withRetry(
        () => withTimeout(
          analyzeContentWithAI({
            content: content.mainContent,
            title: content.metadata.title || '',
            metadata: {
              description: content.metadata.description,
              keywords: content.metadata.keywords,
              author: content.metadata.author
            }
          }),
          apiConfig.maxTimeout
        )
      );

      // Predict engagement metrics with retries
      const engagementMetrics = await withRetry(
        () => withTimeout(
          predictEngagementMetrics(
            content.mainContent,
            aiAnalysis
          ),
          apiConfig.maxTimeout
        )
      );

      // Combine all analysis results
      const analysisResult = {
        analyzedUrlId: recordId,
        engagementScore: contentAnalysis.engagement_score,
        engagementExplanation: contentAnalysis.engagement_explanation,
        contentQualityScore: contentAnalysis.content_quality_score,
        contentQualityExplanation: contentAnalysis.content_quality_explanation,
        readabilityScore: contentAnalysis.readability_score,
        readabilityExplanation: contentAnalysis.readability_explanation,
        seoScore: contentAnalysis.seo_score,
        seoExplanation: contentAnalysis.seo_explanation,
        industry: contentAnalysis.industry,
        industryExplanation: contentAnalysis.industry_explanation,
        scope: contentAnalysis.scope,
        scopeExplanation: contentAnalysis.scope_explanation,
        topics: mainTopics,
        topicsExplanation: contentAnalysis.topics_explanation,
        writingQuality: contentAnalysis.writing_quality,
        audienceLevel: contentAnalysis.audience_level,
        audienceLevelExplanation: contentAnalysis.audience_level_explanation,
        contentType: contentAnalysis.content_type,
        contentTypeExplanation: contentAnalysis.content_type_explanation,
        tone: contentAnalysis.tone,
        toneExplanation: contentAnalysis.tone_explanation,
        estimatedReadTime: contentAnalysis.estimated_read_time,
        keywords: contentAnalysis.keywords,
        keywordAnalysis: {
          distribution: `${(keywordAnalysis.distribution * 100).toFixed(1)}%`,
                overused: keywordAnalysis.overuse,
                underused: keywordAnalysis.underuse,
          explanation: 'Keyword distribution analysis'
        },
        insights: contentAnalysis.insights,
        engagement: engagementMetrics,
        wordCountStats: contentAnalysis.word_count_stats,
        articlesPerMonth: contentAnalysis.articles_per_month,
        articlesPerMonthExplanation: contentAnalysis.articles_per_month_explanation,
        topicCoherence
      };

      // Save analysis results with timeout
      const [savedAnalytics] = await withTimeout(
        db
          .insert(contentAnalytics)
          .values(analysisResult)
          .returning(),
        apiConfig.maxTimeout
      );

      // Update URL status with timeout
      await withTimeout(
        db
          .update(analyzedUrls)
            .set({ 
              status: 'completed',
            completedAt: new Date()
          })
          .where(eq(analyzedUrls.id, recordId)),
        apiConfig.maxTimeout
      );

      return new Response(
        JSON.stringify(savedAnalytics),
        { status: 200 }
      );
      } catch (error) {
      // Update URL status to failed with timeout
      await withTimeout(
        db
          .update(analyzedUrls)
            .set({ 
              status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
            })
          .where(eq(analyzedUrls.id, recordId)),
        apiConfig.maxTimeout
      );
        
        throw error;
      }
  } catch (error) {
    console.error('Error analyzing content:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to analyze content',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500 }
    );
  }
} 