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

export async function POST(request: NextRequest) {
  let urlRecord: UrlRecord | undefined;
  
  try {
    const body = await request.json() as { url: string };
    
    if (!body.url || typeof body.url !== 'string') {
      return new Response(
        JSON.stringify({
          error: {
            message: 'URL is required and must be a string'
          }
        }),
        { status: 400 }
      );
    }

    // Create a promise that rejects after the timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Analysis timed out after 120 seconds')), ANALYSIS_TIMEOUT);
    });

    // Wrap the entire analysis process in a race with the timeout
    const analysisPromise = (async () => {
      try {
        // Check for existing analysis first
        const existingUrl = await db.query.analyzedUrls.findFirst({
          where: eq(analyzedUrls.url, body.url)
        });
        
        if (existingUrl) {
          urlRecord = existingUrl;
          
          const existingAnalytics = await db.query.contentAnalytics.findFirst({
            where: eq(contentAnalytics.analyzedUrlId, existingUrl.id)
          });
          
          if (existingAnalytics) {
            return new Response(JSON.stringify({ data: existingAnalytics }));
          }
        }

        // Create new URL record if it doesn't exist
        if (!urlRecord) {
          const [newUrl] = await db.insert(analyzedUrls).values({
            url: body.url,
            status: 'processing'
          }).returning();
          urlRecord = newUrl;
        }

        // Scrape the content with error handling
        console.log('Starting content scraping...');
        const result = await scrapePuppeteer(body.url);
        
        if (result.error) {
          throw new Error(`Scraping failed: ${result.error.message}`);
        }

        if (!result.content || !result.content.mainContent) {
          throw new Error('Failed to extract content from URL');
        }

        console.log('Content scraped successfully, analyzing...');

        // Get the main content and calculate statistics
        const { mainContent, metadata } = result.content;
        const wordCount = calculateWordCount(mainContent);
        const estimatedReadTime = calculateReadingTime(wordCount);

        // Get existing stats
        let existingStats: WordCountStats | undefined;
        if (urlRecord) {
          const existingAnalytics = await db.query.contentAnalytics.findFirst({
            where: eq(contentAnalytics.analyzedUrlId, urlRecord.id)
          });
          if (existingAnalytics?.wordCountStats) {
            existingStats = existingAnalytics.wordCountStats;
          }
        }

        // Calculate word count statistics
        const wordCountStats = getWordCountStats(mainContent, existingStats);

        // Get current month for articles
        const currentDate = new Date();
        const monthKey = currentDate.toISOString().slice(0, 7);
        const articlesPerMonth = [{
          date: monthKey,
          count: 1
        }];

        console.log('Starting AI analysis...');

        // Use AI to analyze the content
        const aiAnalysis = await analyzeContentWithAI({
          content: mainContent,
          title: metadata.title || '',
          metadata: {
            description: metadata.description,
            keywords: Array.isArray(metadata.keywords) ? metadata.keywords.join(', ') : metadata.keywords,
            author: metadata.author
          }
        });

        console.log('AI analysis complete, predicting engagement...');

        // Extract keywords from content if none are provided by AI
        if (!aiAnalysis.keywords || !Array.isArray(aiAnalysis.keywords) || aiAnalysis.keywords.length === 0) {
          console.log('No keywords found in AI analysis, extracting from content...');
          try {
            // Extract keywords from the content using the extractKeywords utility
            const { extractKeywords } = await import('@/utils/keywords');
            const extractedKeywords = extractKeywords(mainContent, { maxKeywords: 10 });
            
            // Convert to the expected format
            aiAnalysis.keywords = extractedKeywords.map(k => ({
              text: k.word,
              count: k.count
            }));
            
            console.log(`Extracted ${aiAnalysis.keywords.length} keywords from content`);
          } catch (keywordError) {
            console.error('Error extracting keywords:', keywordError);
            // Provide a fallback if extraction fails
            aiAnalysis.keywords = [];
          }
        } else {
          // Ensure keywords are in the correct format
          console.log('Keywords found in AI analysis, ensuring proper format...');
          aiAnalysis.keywords = aiAnalysis.keywords.map(keyword => {
            if (typeof keyword === 'string') {
              // Convert string keywords to objects with count 1
              return { text: keyword, count: 1 };
            } else if (typeof keyword === 'object' && keyword !== null) {
              // Ensure object keywords have text and count properties
              return {
                text: 'text' in keyword ? keyword.text : String(keyword),
                count: 'count' in keyword ? Number(keyword.count) : 1
              };
            } else {
              // Fallback for unexpected types
              return { text: String(keyword), count: 1 };
            }
          });
          console.log(`Formatted ${aiAnalysis.keywords.length} keywords from AI analysis`);
        }

        // Generate keyword analysis if missing
        if (!aiAnalysis.keywordAnalysis || !aiAnalysis.keywordAnalysis.distribution) {
          console.log('No keyword analysis found in AI response, generating...');
          try {
            // Generate keyword analysis using the analyzeKeywordUsage utility
            const { analyzeKeywordUsage } = await import('@/utils/keywords');
            
            // Extract keyword texts from the keywords array
            const keywordTexts = aiAnalysis.keywords?.map(k => {
              if (typeof k === 'string') return k;
              if (typeof k === 'object' && k !== null && 'text' in k) return k.text;
              return '';
            }).filter(Boolean) || [];
            
            if (keywordTexts.length > 0) {
              console.log(`Analyzing ${keywordTexts.length} keywords for distribution...`);
              const keywordAnalysis = analyzeKeywordUsage(mainContent, keywordTexts);
              
              aiAnalysis.keywordAnalysis = {
                distribution: `${(keywordAnalysis.distribution * 100).toFixed(1)}% of paragraphs contain keywords`,
                overused: keywordAnalysis.overuse,
                underused: keywordAnalysis.underuse,
                explanation: 'Keywords were analyzed for distribution and density across the content.'
              };
              
              console.log('Generated keyword analysis');
            } else {
              console.log('No valid keywords found for analysis');
              aiAnalysis.keywordAnalysis = {
                distribution: '0% of paragraphs contain keywords',
                overused: [],
                underused: [],
                explanation: 'No keywords were available for analysis.'
              };
            }
          } catch (analysisError) {
            console.error('Error generating keyword analysis:', analysisError);
            // Provide a fallback if analysis fails
            aiAnalysis.keywordAnalysis = {
              distribution: 'Unable to analyze keyword distribution',
              overused: [],
              underused: [],
              explanation: 'An error occurred during keyword analysis.'
            };
          }
        }

        // Predict engagement metrics
        const predictedEngagement = await predictEngagementMetrics(
          mainContent,
          aiAnalysis
        );

        console.log('Analysis complete, storing results...');

        // Store analytics in database
        if (urlRecord) {
          await db.update(analyzedUrls)
            .set({ 
              status: 'completed',
              completedAt: new Date(),
              updatedAt: new Date()
            })
            .where(eq(analyzedUrls.id, urlRecord.id));
          
          const analytics = {
            analyzedUrlId: urlRecord.id,
            engagementScore: aiAnalysis.engagementScore ?? 0,
            engagementExplanation: aiAnalysis.engagementExplanation ?? null,
            contentQualityScore: aiAnalysis.contentQualityScore ?? 0,
            contentQualityExplanation: aiAnalysis.contentQualityExplanation ?? null,
            readabilityScore: aiAnalysis.readabilityScore ?? 0,
            readabilityExplanation: aiAnalysis.readabilityExplanation ?? null,
            seoScore: aiAnalysis.seoScore ?? 0,
            seoExplanation: aiAnalysis.seoExplanation ?? null,
            industry: aiAnalysis.industry ?? 'General',
            industryExplanation: aiAnalysis.industryExplanation ?? null,
            scope: aiAnalysis.scope ?? 'General',
            scopeExplanation: aiAnalysis.scopeExplanation ?? null,
            topics: aiAnalysis.topics ?? [],
            topicsExplanation: aiAnalysis.topicsExplanation ?? null,
            writingQuality: aiAnalysis.writingQuality ?? {
              grammar: 0,
              clarity: 0,
              structure: 0,
              vocabulary: 0,
              overall: 0,
              explanations: {
                grammar: '',
                clarity: '',
                structure: '',
                vocabulary: '',
                overall: ''
              }
            },
            audienceLevel: aiAnalysis.audienceLevel ?? 'General',
            audienceLevelExplanation: aiAnalysis.audienceLevelExplanation ?? null,
            contentType: aiAnalysis.contentType ?? 'Article',
            contentTypeExplanation: aiAnalysis.contentTypeExplanation ?? null,
            tone: aiAnalysis.tone ?? 'Neutral',
            toneExplanation: aiAnalysis.toneExplanation ?? null,
            estimatedReadTime,
            keywords: aiAnalysis.keywords ?? [],
            keywordAnalysis: aiAnalysis.keywordAnalysis ?? {
              distribution: '',
              overused: [],
              underused: [],
              explanation: ''
            },
            engagement: predictedEngagement,
            insights: aiAnalysis.insights ?? {
              engagement: [],
              content: [],
              readability: [],
              seo: []
            },
            articlesPerMonth,
            wordCountStats
          };
          
          await db.insert(contentAnalytics).values(analytics);
          
          return new Response(JSON.stringify({ data: analytics }));
        }

        throw new Error('Failed to create URL record');
      } catch (error) {
        // Update URL status to failed if we have a record
        if (urlRecord) {
          await db.update(analyzedUrls)
            .set({ 
              status: 'failed',
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
              updatedAt: new Date()
            })
            .where(eq(analyzedUrls.id, urlRecord.id));
        }
        
        throw error;
      }
    })();

    // Race between the analysis and the timeout
    return await Promise.race([analysisPromise, timeoutPromise]);

  } catch (error) {
    console.error('Error in analyze-content API:', error);
    
    // Update URL status to failed if we have a record
    if (urlRecord) {
      await db.update(analyzedUrls)
        .set({ 
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          updatedAt: new Date()
        })
        .where(eq(analyzedUrls.id, urlRecord.id));
    }
    
    return new Response(
      JSON.stringify({
        error: {
          message: error instanceof Error ? error.message : 'An unknown error occurred',
          details: error instanceof Error ? error.stack : undefined
        }
      }),
      { status: 500 }
    );
  }
} 