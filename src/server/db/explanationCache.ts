import { db } from ".";
import { analyzedUrls, urlMetadata, urlContent, contentAnalytics } from "./schema";
import { eq } from "drizzle-orm";
import type { ExtendedAnalytics } from "@/types/analytics";
import type { AnalyticsResult } from "@/app/api/analyze-content/route";
import type { InferSelectModel } from "drizzle-orm";

type ContentAnalytics = InferSelectModel<typeof contentAnalytics>;

export async function getCachedAnalytics(url: string): Promise<ExtendedAnalytics | null> {
  try {
    // Get the analyzed URL record with relations
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

    // Construct the response with all explanations
    const analyticsResult: AnalyticsResult = {
      engagementScore: urlRecord.analytics.engagementScore,
      engagementExplanation: urlRecord.analytics.engagementExplanation ?? 'Analysis of content engagement potential',
      contentQualityScore: urlRecord.analytics.contentQualityScore,
      contentQualityExplanation: urlRecord.analytics.contentQualityExplanation ?? 'Analysis of content quality metrics',
      readabilityScore: urlRecord.analytics.readabilityScore,
      readabilityExplanation: urlRecord.analytics.readabilityExplanation ?? 'Analysis of content readability',
      seoScore: urlRecord.analytics.seoScore,
      seoExplanation: urlRecord.analytics.seoExplanation ?? 'Analysis of SEO optimization',
      insights: urlRecord.analytics.insights,
      industry: urlRecord.analytics.industry,
      industryExplanation: urlRecord.analytics.industryExplanation ?? 'Industry classification',
      scope: urlRecord.analytics.scope,
      scopeExplanation: urlRecord.analytics.scopeExplanation ?? 'Content scope analysis',
      topics: urlRecord.analytics.topics,
      topicsExplanation: urlRecord.analytics.topicsExplanation ?? 'Topic analysis',
      writingQuality: urlRecord.analytics.writingQuality,
      audienceLevel: urlRecord.analytics.audienceLevel,
      audienceLevelExplanation: urlRecord.analytics.audienceLevelExplanation ?? 'Audience level analysis',
      contentType: urlRecord.analytics.contentType,
      contentTypeExplanation: urlRecord.analytics.contentTypeExplanation ?? 'Content type analysis',
      tone: urlRecord.analytics.tone,
      toneExplanation: urlRecord.analytics.toneExplanation ?? 'Content tone analysis',
      estimatedReadTime: urlRecord.analytics.estimatedReadTime,
      keywords: urlRecord.analytics.keywords,
      keywordAnalysis: urlRecord.analytics.keywordAnalysis,
      engagement: urlRecord.analytics.engagement,
      stats: {
        wordCountStats: urlRecord.analytics.wordCountStats,
        articlesPerMonth: urlRecord.analytics.articlesPerMonth
      }
    };

    return {
      currentArticle: analyticsResult,
      stats: {
        wordCountStats: urlRecord.analytics.wordCountStats,
        articlesPerMonth: urlRecord.analytics.articlesPerMonth
      }
    };
  } catch (error) {
    console.error('Error getting cached analytics:', error);
    return null;
  }
} 