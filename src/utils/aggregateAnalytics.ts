import { db } from '@/lib/db';
import { eq, inArray } from 'drizzle-orm';
import { analyzedUrls, contentAnalytics } from '@/lib/schema';
import type { InferSelectModel } from 'drizzle-orm';

type ContentAnalytics = InferSelectModel<typeof contentAnalytics>;

interface AggregatedAnalytics {
  contentTypeStats: Record<
    string,
    {
      count: number;
      avgEngagement: number;
      avgReadability: number;
      avgSeo: number;
      bestPerformingTopics: string[];
      bestTimeOfDay: string;
      audienceLevel: string;
      tone: string;
    }
  >;
  topTopics: string[];
  globalInsights: {
    bestDayOfWeek: string;
    optimalLength: number;
    mostEngagingTone: string;
    audiencePreferences: {
      level: string;
      interests: string[];
    };
    contentGaps: string[];
    seasonalTrends: Array<{
      season: string;
      topics: string[];
    }>;
  };
  keywordAnalysis: {
    trending: string[];
    underutilized: string[];
    overused: string[];
  };
  engagementPatterns: {
    timeOfDay: Record<string, number>;
    dayOfWeek: Record<string, number>;
    contentLength: Record<string, number>;
  };
}

interface ContentTypeStats {
  count: number;
  engagementSum: number;
  readabilitySum: number;
  seoSum: number;
  topics: Map<string, { count: number; engagement: number }>;
  timeSlots: Map<number, { count: number; engagement: number }>;
  audienceLevels: Map<string, number>;
  tones: Map<string, number>;
}

export async function aggregateUserAnalytics(userId: string): Promise<AggregatedAnalytics> {
  // Fetch all analyzed URLs for the user
  const userUrls = await db
    .select()
    .from(analyzedUrls)
    .where(eq(analyzedUrls.userId, userId));

  if (userUrls.length === 0) {
    return getEmptyAnalytics();
  }

  // Fetch analytics for those URLs
  const analytics = await db
    .select()
    .from(contentAnalytics)
    .where(inArray(contentAnalytics.analyzedUrlId, userUrls.map((u) => u.id)));

  const contentTypeStats: Record<string, ContentTypeStats> = {};
  const allTopics: string[] = [];
  const engagementByTime: Record<string, number> = {};
  const engagementByDay: Record<string, number> = {};
  const engagementByLength: Record<string, number> = {};
  const keywordStats = new Map<string, { count: number; engagement: number }>();

  for (const analytic of analytics) {
    const contentType = analytic.contentType || 'Article';
    const date = new Date(analytic.createdAt);
    const hour = date.getHours();
    const day = date.getDay();
    const wordCount = analytic.wordCountStats?.count || 0;

    // Initialize content type stats if needed
    if (!contentTypeStats[contentType]) {
      contentTypeStats[contentType] = {
        count: 0,
        engagementSum: 0,
        readabilitySum: 0,
        seoSum: 0,
        topics: new Map<string, { count: number; engagement: number }>(),
        timeSlots: new Map<number, { count: number; engagement: number }>(),
        audienceLevels: new Map<string, number>(),
        tones: new Map<string, number>(),
      };
    }

    // Update content type statistics
    const stats = contentTypeStats[contentType];
    stats.count++;
    stats.engagementSum += analytic.engagementScore;
    stats.readabilitySum += analytic.readabilityScore;
    stats.seoSum += analytic.seoScore;

    // Track topics and their performance
    if (analytic.topics && Array.isArray(analytic.topics)) {
      allTopics.push(...analytic.topics);
      for (const topic of analytic.topics) {
        if (typeof topic === 'string') {
          const topicStats = stats.topics.get(topic) || { count: 0, engagement: 0 };
          topicStats.count++;
          topicStats.engagement += analytic.engagementScore;
          stats.topics.set(topic, topicStats);
        }
      }
    }

    // Track time-based engagement
    const timeKey = `${hour}:00`;
    engagementByTime[timeKey] = (engagementByTime[timeKey] || 0) + analytic.engagementScore;
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
    const dayKey = days[day];
    if (dayKey) {
      engagementByDay[dayKey] = (engagementByDay[dayKey] || 0) + analytic.engagementScore;
    }

    // Track length-based engagement
    const lengthKey = wordCount < 500 ? 'short' : wordCount < 1500 ? 'medium' : 'long';
    engagementByLength[lengthKey] = (engagementByLength[lengthKey] || 0) + analytic.engagementScore;

    // Track audience level and tone preferences
    if (analytic.audienceLevel) {
      stats.audienceLevels.set(
        analytic.audienceLevel,
        (stats.audienceLevels.get(analytic.audienceLevel) || 0) + 1
      );
    }
    if (analytic.tone) {
      stats.tones.set(
        analytic.tone,
        (stats.tones.get(analytic.tone) || 0) + 1
      );
    }

    // Track keyword performance
    if (analytic.keywords && Array.isArray(analytic.keywords)) {
      for (const kw of analytic.keywords) {
        const keyword = typeof kw === 'string' ? kw : kw.text;
        if (keyword) {
          const existing = keywordStats.get(keyword) || { count: 0, engagement: 0 };
          existing.count++;
          existing.engagement += analytic.engagementScore;
          keywordStats.set(keyword, existing);
        }
      }
    }
  }

  return {
    contentTypeStats: processContentTypeStats(contentTypeStats),
    topTopics: getTopTopics(allTopics),
    globalInsights: {
      bestDayOfWeek: getBestPerforming<string>(engagementByDay),
      optimalLength: getBestPerforming<number>(engagementByLength, 'number'),
      mostEngagingTone: getMostCommonTone(contentTypeStats),
      audiencePreferences: getAudiencePreferences(contentTypeStats),
      contentGaps: identifyContentGaps(contentTypeStats, allTopics),
      seasonalTrends: analyzeSeasonalTrends(analytics),
    },
    keywordAnalysis: analyzeKeywords(keywordStats),
    engagementPatterns: {
      timeOfDay: engagementByTime,
      dayOfWeek: engagementByDay,
      contentLength: engagementByLength,
    },
  };
}

function getEmptyAnalytics(): AggregatedAnalytics {
  return {
    contentTypeStats: {},
    topTopics: [],
    globalInsights: {
      bestDayOfWeek: '',
      optimalLength: 1000,
      mostEngagingTone: '',
      audiencePreferences: {
        level: '',
        interests: [],
      },
      contentGaps: [],
      seasonalTrends: [],
    },
    keywordAnalysis: {
      trending: [],
      underutilized: [],
      overused: [],
    },
    engagementPatterns: {
      timeOfDay: {},
      dayOfWeek: {},
      contentLength: {},
    },
  };
}

function processContentTypeStats(rawStats: Record<string, ContentTypeStats>) {
  const processed: AggregatedAnalytics['contentTypeStats'] = {};

  for (const [type, stats] of Object.entries(rawStats)) {
    const bestTopics = Array.from(stats.topics.entries())
      .sort((a, b) => b[1].engagement / b[1].count - a[1].engagement / a[1].count)
      .slice(0, 3)
      .map(([topic]) => topic);

    const bestTimeSlot = Array.from(stats.timeSlots.entries())
      .sort((a, b) => b[1].engagement / b[1].count - a[1].engagement / a[1].count)
      .map(([hour]) => hour.toString().padStart(2, '0') + ':00')[0] || '09:00';

    processed[type] = {
      count: stats.count,
      avgEngagement: stats.engagementSum / stats.count,
      avgReadability: stats.readabilitySum / stats.count,
      avgSeo: stats.seoSum / stats.count,
      bestPerformingTopics: bestTopics,
      bestTimeOfDay: bestTimeSlot,
      audienceLevel: getBestPerforming(stats.audienceLevels) || 'General',
      tone: getBestPerforming(stats.tones) || 'Neutral',
    };
  }

  return processed;
}

function getTopTopics(topics: string[]): string[] {
  const topicCounts = topics.reduce((acc, topic) => {
    acc.set(topic, (acc.get(topic) || 0) + 1);
    return acc;
  }, new Map<string, number>());

  return Array.from(topicCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([topic]) => topic);
}

function getBestPerforming<T extends string | number>(stats: Record<string, number> | Map<string, number>, returnType: 'string' | 'number' = 'string'): T {
  if (stats instanceof Map) {
    const entries = Array.from(stats.entries());
    if (entries.length === 0) return (returnType === 'string' ? '' : 0) as T;
    const sorted = entries.sort((a, b) => b[1] - a[1]);
    const value = sorted[0]?.[returnType === 'string' ? 0 : 1];
    return (value ?? (returnType === 'string' ? '' : 0)) as T;
  }
  const entries = Object.entries(stats);
  if (entries.length === 0) return (returnType === 'string' ? '' : 0) as T;
  const sorted = entries.sort((a, b) => b[1] - a[1]);
  const value = sorted[0]?.[returnType === 'string' ? 0 : 1];
  return (value ?? (returnType === 'string' ? '' : 0)) as T;
}

function getMostCommonTone(contentTypeStats: Record<string, ContentTypeStats>): string {
  const allTones = new Map<string, number>();
  for (const stats of Object.values(contentTypeStats)) {
    for (const [tone, count] of stats.tones) {
      allTones.set(tone, (allTones.get(tone) || 0) + count);
    }
  }
  return getBestPerforming(allTones);
}

function getAudiencePreferences(contentTypeStats: Record<string, ContentTypeStats>) {
  const allLevels = new Map<string, number>();
  const allTopics = new Map<string, number>();

  for (const stats of Object.values(contentTypeStats)) {
    for (const [level, count] of stats.audienceLevels) {
      allLevels.set(level, (allLevels.get(level) || 0) + count);
    }
    for (const [topic, { count }] of stats.topics) {
      allTopics.set(topic, (allTopics.get(topic) || 0) + count);
    }
  }

  return {
    level: getBestPerforming<string>(allLevels),
    interests: Array.from(allTopics.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic),
  };
}

function identifyContentGaps(contentTypeStats: Record<string, ContentTypeStats>, allTopics: string[]): string[] {
  const topicCounts = new Map<string, number>();
  for (const topic of allTopics) {
    topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
  }

  return Array.from(topicCounts.entries())
    .filter(([_, count]) => count < 3)
    .map(([topic]) => topic)
    .slice(0, 5);
}

function analyzeSeasonalTrends(analytics: ContentAnalytics[]): Array<{ season: string; topics: string[] }> {
  const seasonalTopics = new Map<string, Map<string, number>>();
  const seasons = ['Spring', 'Summer', 'Fall', 'Winter'] as const;

  for (const analytic of analytics) {
    if (!analytic.createdAt) continue;

    const date = new Date(analytic.createdAt);
    const month = date.getMonth();
    const seasonIndex = Math.floor(month / 3) % 4;
    const season = seasons[seasonIndex];
    
    if (!season) continue; // Skip if season is undefined

    if (!seasonalTopics.has(season)) {
      seasonalTopics.set(season, new Map());
    }

    const topicsForSeason = seasonalTopics.get(season);
    if (topicsForSeason && analytic.topics && Array.isArray(analytic.topics)) {
      for (const topic of analytic.topics) {
        if (typeof topic === 'string') {
          topicsForSeason.set(topic, (topicsForSeason.get(topic) || 0) + 1);
        }
      }
    }
  }

  const result: Array<{ season: string; topics: string[] }> = [];
  for (const [season, topics] of seasonalTopics.entries()) {
    const topicList = Array.from(topics.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic);

    result.push({
      season: season as string,
      topics: topicList,
    });
  }

  return result;
}

function analyzeKeywords(keywordStats: Map<string, { count: number; engagement: number }>) {
  const entries = Array.from(keywordStats.entries());
  if (entries.length === 0) {
    return {
      trending: [],
      underutilized: [],
      overused: [],
    };
  }

  const avgEngagement = entries.reduce((sum, [_, stats]) => sum + stats.engagement / stats.count, 0) / entries.length;

  const trending = entries
    .filter(([_, stats]) => stats.engagement / stats.count > avgEngagement * 1.2)
    .sort((a, b) => b[1].engagement / b[1].count - a[1].engagement / a[1].count)
    .slice(0, 5)
    .map(([keyword]) => keyword);

  const underutilized = entries
    .filter(([_, stats]) => stats.count < 3 && stats.engagement / stats.count > avgEngagement)
    .sort((a, b) => b[1].engagement / b[1].count - a[1].engagement / a[1].count)
    .slice(0, 5)
    .map(([keyword]) => keyword);

  const overused = entries
    .filter(([_, stats]) => stats.count > 5 && stats.engagement / stats.count < avgEngagement * 0.8)
    .sort((a, b) => a[1].engagement / a[1].count - b[1].engagement / b[1].count)
    .slice(0, 5)
    .map(([keyword]) => keyword);

  return { trending, underutilized, overused };
}