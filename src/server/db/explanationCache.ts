import { db } from ".";
import { analyzedUrls, urlMetadata, urlContent, contentAnalytics } from "./schema";
import { eq } from "drizzle-orm";
import type { ExtendedAnalytics } from "@/types/analytics";
import type { InferSelectModel } from "drizzle-orm";

type ContentAnalytics = InferSelectModel<typeof contentAnalytics>;

export async function getCachedAnalytics(url: string): Promise<ExtendedAnalytics | null> {
  try {
    // Get the analyzed URL record
    const urlRecord = await db.query.analyzedUrls.findFirst({
      where: eq(analyzedUrls.url, url),
      with: {
        metadata: true,
        content: true,
        analytics: true
      }
    });

    if (!urlRecord || urlRecord.status !== 'completed' || !urlRecord.analytics) {
      return null;
    }

    const analytics = urlRecord.analytics as ContentAnalytics;

    // Construct the response with all explanations
    const result: ExtendedAnalytics = {
      currentArticle: {
        engagementScore: analytics.engagementScore,
        contentQualityScore: analytics.contentQualityScore,
        readabilityScore: analytics.readabilityScore,
        seoScore: analytics.seoScore,
        insights: analytics.insights,
        industry: analytics.industry,
        scope: analytics.scope,
        topics: analytics.topics,
        writingQuality: analytics.writingQuality,
        audienceLevel: analytics.audienceLevel,
        contentType: analytics.contentType,
        tone: analytics.tone,
        estimatedReadTime: analytics.estimatedReadTime,
        keywords: analytics.keywords,
        keywordAnalysis: analytics.keywordAnalysis,
        engagement: analytics.engagement
      },
      stats: {
        wordCountStats: analytics.wordCountStats,
        articlesPerMonth: analytics.articlesPerMonth
      },
      articles: {
        total: 0,
        articles: [],
        urlPatterns: []
      }
    };

    return result;
  } catch (error) {
    console.error('Error getting cached analytics:', error);
    return null;
  }
} 