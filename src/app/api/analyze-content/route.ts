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
const ANALYSIS_TIMEOUT = 55000; // 55 seconds to stay under the 60s serverless limit

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 55000);

  try {
    const { url } = await req.json();
    console.log('Starting analysis for URL:', url);

    if (!url) {
      clearTimeout(timeoutId);
      return Response.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // First check if we already have analysis for this URL
    const existingUrl = await db.query.analyzedUrls.findFirst({
      where: eq(analyzedUrls.url, url),
      with: {
        analytics: true
      }
    });

    if (existingUrl?.analytics) {
      console.log('Found existing analysis for URL');
      clearTimeout(timeoutId);
      return Response.json({
        data: {
          currentArticle: existingUrl.analytics
        }
      }, { status: 200 });
    }

    // Create or update the analyzed URL record
    let analyzedUrlId: number;
    if (!existingUrl) {
      const [newUrl] = await db.insert(analyzedUrls).values({
        url: url,
        status: 'processing',
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      if (!newUrl) {
        throw new Error('Failed to create analyzed URL record');
      }
      analyzedUrlId = newUrl.id;
    } else {
      analyzedUrlId = existingUrl.id;
      await db.update(analyzedUrls)
        .set({ 
          status: 'processing',
          updatedAt: new Date()
        })
        .where(eq(analyzedUrls.id, analyzedUrlId));
    }

    console.log('1. Scraping content...');
    const scrapedResult = await scrapePuppeteer(url);

    if (scrapedResult.error) {
      console.error('Scraping failed:', scrapedResult.error);
      await db.update(analyzedUrls)
        .set({ 
          status: 'failed',
          errorMessage: scrapedResult.error.message,
          updatedAt: new Date()
        })
        .where(eq(analyzedUrls.id, analyzedUrlId));
      
      clearTimeout(timeoutId);
      return Response.json(
        { error: scrapedResult.error.message },
        { status: 500 }
      );
    }

    if (!scrapedResult.content) {
      console.error('No content found in scraped result');
      await db.update(analyzedUrls)
        .set({ 
          status: 'failed',
          errorMessage: 'No content found in the scraped result',
          updatedAt: new Date()
        })
        .where(eq(analyzedUrls.id, analyzedUrlId));
      
      clearTimeout(timeoutId);
      return Response.json(
        { error: 'No content found in the scraped result' },
        { status: 400 }
      );
    }

    console.log('2. Checking content length...');
    const wordCount = (scrapedResult.content.mainContent || '').split(/\s+/).length;
    console.log('Word count:', wordCount);
    
    if (wordCount > 5000) {
      await db.update(analyzedUrls)
        .set({ 
          status: 'failed',
          errorMessage: 'Content is too long to analyze',
          updatedAt: new Date()
        })
        .where(eq(analyzedUrls.id, analyzedUrlId));
      
      clearTimeout(timeoutId);
      return Response.json(
        { error: 'Content is too long to analyze. Please try a shorter article (less than 5000 words).' },
        { status: 400 }
      );
    }

    try {
      console.log('3. Starting content analysis...');
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
        new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Content analysis timed out after 45 seconds. The article may be too complex to analyze.'));
          }, 45000);
        })
      ]);

      console.log('4. Content analysis completed:', analysis ? 'success' : 'no data');
      if (!analysis) {
        throw new Error('Content analysis returned no data');
      }

      // Ensure all required fields are present with default values if needed
      const baseAnalysis = {
        engagementScore: 0,
        contentQualityScore: 0,
        readabilityScore: 0,
        seoScore: 0,
        insights: {
          engagement: [],
          content: [],
          readability: [],
          seo: []
        },
        industry: 'General',
        scope: 'General',
        topics: [],
        writingQuality: {
          grammar: 0,
          clarity: 0,
          structure: 0,
          vocabulary: 0,
          overall: 0
        },
        audienceLevel: 'General',
        contentType: 'Article',
        tone: 'Neutral',
        estimatedReadTime: calculateReadingTime(wordCount),
        keywords: [],
        keywordAnalysis: {
          distribution: '',
          overused: [],
          underused: []
        },
        ...analysis
      };

      console.log('5. Starting engagement prediction...');
      let engagement;
      try {
        engagement = await Promise.race([
          predictEngagementMetrics(
            scrapedResult.content.mainContent || '',
            baseAnalysis
          ),
          new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error('Engagement prediction timed out.'));
            }, 8000);
          })
        ]);
      } catch (engagementError) {
        console.warn('Engagement prediction failed:', engagementError);
        engagement = {
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
        };
      }

      console.log('6. Preparing final response...');
      const finalAnalysis = {
        ...baseAnalysis,
        engagement,
        stats: {
          wordCountStats: getWordCountStats(scrapedResult.content.mainContent || ''),
          articlesPerMonth: []
        }
      };

      // Store the analysis in the database
      console.log('Storing analysis in database...');
      try {
        const [analytics] = await db.insert(contentAnalytics).values({
          analyzed_url_id: analyzedUrlId,
          engagement_score: finalAnalysis.engagementScore,
          content_quality_score: finalAnalysis.contentQualityScore,
          readability_score: finalAnalysis.readabilityScore,
          seo_score: finalAnalysis.seoScore,
          industry: finalAnalysis.industry,
          scope: finalAnalysis.scope,
          topics: finalAnalysis.topics,
          writing_quality: finalAnalysis.writingQuality,
          audience_level: finalAnalysis.audienceLevel,
          content_type: finalAnalysis.contentType,
          tone: finalAnalysis.tone,
          estimated_read_time: finalAnalysis.estimatedReadTime,
          keywords: finalAnalysis.keywords,
          keyword_analysis: finalAnalysis.keywordAnalysis,
          insights: finalAnalysis.insights,
          word_count_stats: finalAnalysis.stats.wordCountStats,
          articles_per_month: finalAnalysis.stats.articlesPerMonth,
          engagement: finalAnalysis.engagement,
          created_at: new Date(),
          updated_at: new Date()
        }).returning();

        // Update the analyzed URL status
        await db.update(analyzedUrls)
          .set({ 
            status: 'completed',
            completedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(analyzedUrls.id, analyzedUrlId));

        console.log('Successfully stored analysis in database');
      } catch (dbError) {
        console.error('Failed to store analysis in database:', dbError);
        await db.update(analyzedUrls)
          .set({ 
            status: 'failed',
            errorMessage: 'Failed to store analysis in database',
            updatedAt: new Date()
          })
          .where(eq(analyzedUrls.id, analyzedUrlId));
      }

      const result = {
        data: {
          currentArticle: finalAnalysis
        }
      };

      console.log('7. Analysis complete, sending response');
      clearTimeout(timeoutId);
      return Response.json(result, { status: 200 });

    } catch (analysisError) {
      console.error('Analysis error:', analysisError);
      await db.update(analyzedUrls)
        .set({ 
          status: 'failed',
          errorMessage: analysisError instanceof Error ? analysisError.message : 'Analysis failed',
          updatedAt: new Date()
        })
        .where(eq(analyzedUrls.id, analyzedUrlId));
      
      clearTimeout(timeoutId);
      return Response.json({ 
        error: analysisError instanceof Error ? analysisError.message : 'Analysis failed',
        details: analysisError instanceof Error ? analysisError.stack : undefined
      }, { status: 408 });
    }
  } catch (error) {
    console.error('Route error:', error);
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return Response.json({ 
          error: 'The request took too long to process. Please try again with a shorter article.',
          code: 'TIMEOUT'
        }, { status: 408 });
      }
      return Response.json({ 
        error: error.message,
        code: 'ERROR'
      }, { status: 500 });
    }
    
    return Response.json({ 
      error: 'An unexpected error occurred',
      code: 'UNKNOWN'
    }, { status: 500 });
  }
} 