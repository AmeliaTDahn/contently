import { db } from '@/lib/db';
import { eq, inArray } from 'drizzle-orm';
import { analyzedUrls, contentAnalytics } from '@/lib/schema';

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

  const contentTypeStats: Record<string, any> = {};
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
        const topicStats = stats.topics.get(topic) || { count: 0, engagement: 0 };
        topicStats.count++;
        topicStats.engagement += analytic.engagementScore;
        stats.topics.set(topic, topicStats);
      }
    }

    // Track time-based engagement
    const timeKey = `${hour}:00`;
    engagementByTime[timeKey] = (engagementByTime[timeKey] || 0) + analytic.engagementScore;
    
    const dayKey = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day];
    engagementByDay[dayKey] = (engagementByDay[dayKey] || 0) + analytic.engagementScore;

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
        const existing = keywordStats.get(keyword) || { count: 0, engagement: 0 };
        existing.count++;
        existing.engagement += analytic.engagementScore;
        keywordStats.set(keyword, existing);
      }
    }
  }

  return {
    contentTypeStats: processContentTypeStats(contentTypeStats),
    topTopics: getTopTopics(allTopics),
    globalInsights: {
      bestDayOfWeek: getBestPerforming(engagementByDay),
      optimalLength: getBestPerforming(engagementByLength),
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
      optimalLength: 0,
      mostEngagingTone: '',
      audiencePreferences: { level: '', interests: [] },
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

function processContentTypeStats(rawStats: Record<string, any>) {
  const processed: AggregatedAnalytics['contentTypeStats'] = {};
  
  for (const [type, stats] of Object.entries(rawStats)) {
    const bestTopics = Array.from(stats.topics.entries())
      .sort((a, b) => (b[1].engagement / b[1].count) - (a[1].engagement / a[1].count))
      .slice(0, 3)
      .map(([topic]) => topic);

    const bestTime = Array.from(stats.timeSlots.entries())
      .sort((a, b) => (b[1].engagement / b[1].count) - (a[1].engagement / a[1].count))
      .map(([hour]) => `${hour}:00`)[0] || '';

    processed[type] = {
      count: stats.count,
      avgEngagement: stats.engagementSum / stats.count,
      avgReadability: stats.readabilitySum / stats.count,
      avgSeo: stats.seoSum / stats.count,
      bestPerformingTopics: bestTopics,
      bestTimeOfDay: bestTime,
      audienceLevel: getBestPerforming(stats.audienceLevels),
      tone: getBestPerforming(stats.tones),
    };
  }
  
  return processed;
}

function getTopTopics(topics: string[]): string[] {
  const counts = topics.reduce((acc, topic) => {
    acc[topic] = (acc[topic] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic]) => topic);
}

function getBestPerforming(stats: Record<string, number> | Map<string, number>): string {
  const entries = stats instanceof Map ? Array.from(stats.entries()) : Object.entries(stats);
  return entries.sort((a, b) => b[1] - a[1])[0]?.[0] || '';
}

function getMostCommonTone(contentTypeStats: Record<string, any>): string {
  const tones = new Map<string, number>();
  for (const stats of Object.values(contentTypeStats)) {
    for (const [tone, count] of stats.tones.entries()) {
      tones.set(tone, (tones.get(tone) || 0) + count);
    }
  }
  return getBestPerforming(tones);
}

function getAudiencePreferences(contentTypeStats: Record<string, any>) {
  const levels = new Map<string, number>();
  const interests = new Set<string>();
  
  for (const stats of Object.values(contentTypeStats)) {
    for (const [level, count] of stats.audienceLevels.entries()) {
      levels.set(level, (levels.get(level) || 0) + count);
    }
    for (const [topic] of stats.topics.entries()) {
      interests.add(topic);
    }
  }
  
  return {
    level: getBestPerforming(levels),
    interests: Array.from(interests).slice(0, 5),
  };
}

function identifyContentGaps(contentTypeStats: Record<string, any>, allTopics: string[]): string[] {
  const gaps: string[] = [];
  const topicCounts = new Map<string, number>();
  
  for (const topic of allTopics) {
    topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
  }
  
  // Find underrepresented topics
  for (const [topic, count] of topicCounts.entries()) {
    if (count < 3) { // Arbitrary threshold
      gaps.push(topic);
    }
  }
  
  return gaps.slice(0, 5);
}

function analyzeSeasonalTrends(analytics: any[]): Array<{ season: string; topics: string[] }> {
  const seasonalTopics = new Map<string, Set<string>>();
  const seasons = ['Winter', 'Spring', 'Summer', 'Fall'];
  
  for (const analytic of analytics) {
    const date = new Date(analytic.createdAt);
    const month = date.getMonth();
    const season = seasons[Math.floor(month / 3)];
    
    if (!seasonalTopics.has(season)) {
      seasonalTopics.set(season, new Set());
    }
    
    if (analytic.topics && Array.isArray(analytic.topics)) {
      for (const topic of analytic.topics) {
        seasonalTopics.get(season)?.add(topic);
      }
    }
  }
  
  return Array.from(seasonalTopics.entries()).map(([season, topics]) => ({
    season,
    topics: Array.from(topics).slice(0, 3),
  }));
}

function analyzeKeywords(keywordStats: Map<string, { count: number; engagement: number }>) {
  const sorted = Array.from(keywordStats.entries())
    .sort((a, b) => (b[1].engagement / b[1].count) - (a[1].engagement / a[1].count));
  
  return {
    trending: sorted.slice(0, 5).map(([kw]) => kw),
    underutilized: sorted.filter(([, stats]) => stats.count < 3).slice(0, 5).map(([kw]) => kw),
    overused: sorted.filter(([, stats]) => stats.count > 10).slice(0, 5).map(([kw]) => kw),
  };
}