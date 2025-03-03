import { db } from ".";
import { analyzedUrls, urlMetadata, urlContent, contentAnalytics } from "./schema";
import { eq } from "drizzle-orm";
import type { ExtendedAnalytics, AnalyticsResult } from "@/types/analytics";

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

    if (!urlRecord || urlRecord.status !== 'completed') {
      return null;
    }

    // Construct the response with all explanations
    const analyticsResult: AnalyticsResult = {
      engagementScore: urlRecord.analytics?.engagementScore ?? 0,
      engagementExplanation: urlRecord.analytics?.engagementExplanation ?? 'Analysis of content engagement potential',
      contentQualityScore: urlRecord.analytics?.contentQualityScore ?? 0,
      contentQualityExplanation: urlRecord.analytics?.contentQualityExplanation ?? 'Analysis of content quality metrics',
      readabilityScore: urlRecord.analytics?.readabilityScore ?? 0,
      readabilityExplanation: urlRecord.analytics?.readabilityExplanation ?? 'Analysis of content readability',
      seoScore: urlRecord.analytics?.seoScore ?? 0,
      seoExplanation: urlRecord.analytics?.seoExplanation ?? 'Analysis of SEO optimization',
      insights: urlRecord.analytics?.insights ?? {
        engagement: [],
        content: [],
        readability: [],
        seo: []
      },
      industry: urlRecord.analytics?.industry ?? '',
      industryExplanation: urlRecord.analytics?.industryExplanation ?? 'Industry classification based on content analysis',
      scope: urlRecord.analytics?.scope ?? '',
      scopeExplanation: urlRecord.analytics?.scopeExplanation ?? 'Content scope analysis',
      topics: urlRecord.analytics?.topics ?? [],
      topicsExplanation: urlRecord.analytics?.topicsExplanation ?? 'Main topics identified in the content',
      writingQuality: urlRecord.analytics?.writingQuality ?? {
        grammar: 0,
        clarity: 0,
        structure: 0,
        vocabulary: 0,
        overall: 0,
        explanations: {
          grammar: 'Grammar analysis of the content',
          clarity: 'Clarity analysis of the content',
          structure: 'Structure analysis of the content',
          vocabulary: 'Vocabulary analysis of the content',
          overall: 'Overall writing quality analysis'
        }
      },
      audienceLevel: urlRecord.analytics?.audienceLevel ?? '',
      audienceLevelExplanation: urlRecord.analytics?.audienceLevelExplanation ?? 'Target audience level analysis',
      contentType: urlRecord.analytics?.contentType ?? '',
      contentTypeExplanation: urlRecord.analytics?.contentTypeExplanation ?? 'Content type classification',
      tone: urlRecord.analytics?.tone ?? '',
      toneExplanation: urlRecord.analytics?.toneExplanation ?? 'Content tone analysis',
      estimatedReadTime: urlRecord.analytics?.estimatedReadTime ?? 0,
      keywords: urlRecord.analytics?.keywords ?? [],
      keywordAnalysis: urlRecord.analytics?.keywordAnalysis ?? {
        distribution: '',
        overused: [],
        underused: [],
        explanation: 'Keyword usage and distribution analysis'
      },
      engagement: urlRecord.analytics?.engagement ?? {
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
        },
        explanations: {
          likes: 'Analysis of content likes',
          comments: 'Analysis of content comments',
          shares: 'Analysis of content shares',
          bookmarks: 'Analysis of content bookmarks',
          totalViews: 'Analysis of total page views',
          uniqueViews: 'Analysis of unique page views',
          avgTimeOnPage: 'Analysis of average time spent on page',
          bounceRate: 'Analysis of page bounce rate',
          socialShares: 'Analysis of social media shares'
        }
      }
    };

    const response: ExtendedAnalytics = {
      currentArticle: analyticsResult,
      stats: {
        wordCountStats: urlRecord.analytics?.wordCountStats ?? {
          count: 0,
          min: 0,
          max: 0,
          avg: 0,
          sum: 0
        },
        articlesPerMonth: urlRecord.analytics?.articlesPerMonth ?? []
      }
    };

    return response;
  } catch (error) {
    console.error('Error fetching cached analytics:', error);
    return null;
  }
} 