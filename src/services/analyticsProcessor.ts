import { contentAnalytics } from "@/server/db/schema";
import type { InferSelectModel } from "drizzle-orm";

type ContentAnalytics = InferSelectModel<typeof contentAnalytics>;

// Types for content calendar generation
export interface ContentPerformanceMetrics {
  contentType: string;
  topic: string;
  platform: string;
  engagementRate: number;
  clickThroughRate?: number;
  conversionRate?: number;
  bestTimeOfDay?: string;
  bestDayOfWeek?: number;
  audienceSegment?: string;
  dataPoints: number;
}

export interface AnalyticsBasedRecommendation {
  contentType: string;
  topic: string;
  platform: string;
  recommendedDate: Date;
  recommendedTime: string;
  rationale: string;
  predictedEngagement: number;
  sourceAnalyticsIds: number[];
}

export interface ContentPreferences {
  monthlyTotal: number;
  platformQuotas: Record<string, number>;
  enabledPlatforms: string[];
}

// Platform-specific content type mapping
export const platformContentTypeMap: Record<string, string[]> = {
  twitter: ["social_post", "infographic", "product_update"],
  linkedin: ["social_post", "case_study", "article", "how_to_guide", "product_update"],
  instagram: ["social_post", "infographic", "product_update"],
  tiktok: ["video", "product_update"],
  youtube: ["video", "how_to_guide", "interview"],
  facebook: ["social_post", "infographic", "video", "product_update"],
  blog: ["blog_post", "case_study", "how_to_guide", "review"],
  email: ["newsletter", "product_update", "case_study"],
  medium: ["blog_post", "case_study", "how_to_guide"],
  website: ["blog_post", "case_study", "how_to_guide", "product_update", "press_release"],
};

// Optimal posting times by platform (based on general best practices)
const optimalPostingTimes: Record<string, { days: number[], times: string[] }> = {
  twitter: {
    days: [1, 2, 3, 4, 5], // Monday-Friday
    times: ["12:00", "15:00", "17:00", "18:00"]
  },
  linkedin: {
    days: [1, 2, 3, 4], // Monday-Thursday
    times: ["08:00", "10:00", "12:00", "17:00"]
  },
  instagram: {
    days: [1, 2, 3, 4, 5, 6, 0], // All week
    times: ["11:00", "13:00", "19:00", "21:00"]
  },
  tiktok: {
    days: [1, 2, 3, 4, 5, 6, 0], // All week
    times: ["09:00", "12:00", "19:00", "21:00"]
  },
  youtube: {
    days: [5, 6, 0], // Friday-Sunday
    times: ["15:00", "16:00", "17:00", "18:00"]
  },
  facebook: {
    days: [3, 4, 5], // Wednesday-Friday
    times: ["13:00", "15:00", "19:00"]
  },
  blog: {
    days: [1, 2], // Monday-Tuesday
    times: ["08:00", "09:00", "10:00"]
  },
  email: {
    days: [2, 3, 4], // Tuesday-Thursday
    times: ["10:00", "14:00", "16:00"]
  },
  medium: {
    days: [1, 2, 6], // Monday, Tuesday, Saturday
    times: ["08:00", "12:00", "17:00"]
  },
  website: {
    days: [1, 2, 3, 4], // Monday-Thursday
    times: ["09:00", "10:00", "11:00"]
  },
};

/**
 * Analyzes content analytics data to extract performance patterns
 */
export function analyzeContentPerformance(analyticsData: ContentAnalytics[]): ContentPerformanceMetrics[] {
  const performanceMetrics: ContentPerformanceMetrics[] = [];
  
  // Group analytics by topic
  const topicGroups = analyticsData.reduce((groups, item) => {
    if (item.topics && item.topics.length > 0) {
      item.topics.forEach((topic: string) => {
        if (!groups[topic]) {
          groups[topic] = [];
        }
        groups[topic].push(item);
      });
    }
    return groups;
  }, {} as Record<string, ContentAnalytics[]>);
  
  // For each topic, analyze performance across different platforms
  Object.entries(topicGroups).forEach(([topic, items]) => {
    // Determine the content type based on the analytics
    const contentType = determineContentType(items);
    
    // For each platform, calculate engagement metrics
    Object.keys(platformContentTypeMap).forEach(platform => {
      // Calculate average engagement rate for this topic on this platform
      // In a real implementation, this would use actual platform-specific data
      // For now, we'll use a simplified calculation based on the engagement score
      const engagementRate = calculateEngagementRate(items, platform);
      
      // Determine best time of day and day of week for posting
      const { bestTimeOfDay, bestDayOfWeek } = determineBestPostingTime(items, platform);
      
      performanceMetrics.push({
        contentType,
        topic,
        platform,
        engagementRate,
        bestTimeOfDay,
        bestDayOfWeek,
        dataPoints: items.length,
      });
    });
  });
  
  return performanceMetrics;
}

/**
 * Determines the content type based on analytics data
 */
function determineContentType(items: ContentAnalytics[]): string {
  // Count occurrences of each content type
  const contentTypeCounts = items.reduce((counts, item) => {
    const type = item.contentType || 'blog_post';
    counts[type] = (counts[type] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);
  
  // Find the most common content type
  let maxCount = 0;
  let mostCommonType = 'blog_post';
  
  Object.entries(contentTypeCounts).forEach(([type, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommonType = type;
    }
  });
  
  return mostCommonType;
}

/**
 * Calculates the engagement rate for a specific platform
 */
function calculateEngagementRate(items: ContentAnalytics[], platform: string): number {
  // In a real implementation, this would use platform-specific engagement metrics
  // For now, we'll use a simplified calculation based on the engagement score
  const totalEngagement = items.reduce((sum, item) => sum + item.engagementScore, 0);
  const avgEngagement = totalEngagement / items.length;
  
  // Apply platform-specific adjustment factor
  const platformFactors: Record<string, number> = {
    twitter: 1.2,
    linkedin: 0.9,
    instagram: 1.3,
    tiktok: 1.5,
    youtube: 1.1,
    facebook: 1.0,
    blog: 0.8,
    email: 0.7,
    medium: 0.85,
    website: 0.75,
  };
  
  return Math.round(avgEngagement * (platformFactors[platform] || 1.0));
}

/**
 * Determines the best posting time for a specific platform
 */
function determineBestPostingTime(items: ContentAnalytics[], platform: string): { bestTimeOfDay: string, bestDayOfWeek: number } {
  // In a real implementation, this would analyze actual engagement timestamps
  // For now, we'll use the predefined optimal posting times
  const platformTimes = optimalPostingTimes[platform] || { days: [1, 3, 5], times: ["09:00", "15:00"] };
  
  // Randomly select one of the optimal times
  const randomDayIndex = Math.floor(Math.random() * platformTimes.days.length);
  const randomTimeIndex = Math.floor(Math.random() * platformTimes.times.length);
  
  // Ensure we always have valid values
  const bestTimeOfDay = platformTimes.times[randomTimeIndex] || "09:00";
  const bestDayOfWeek = platformTimes.days[randomDayIndex] || 1;
  
  return {
    bestTimeOfDay,
    bestDayOfWeek,
  };
}

/**
 * Generates content calendar suggestions based on analytics data
 */
export function generateContentCalendar(
  analyticsData: ContentAnalytics[],
  startDate: Date,
  endDate: Date,
  userId?: string,
  contentPreferences?: ContentPreferences,
  extractMetricsOnly: boolean = false
): AnalyticsBasedRecommendation[] | ContentPerformanceMetrics[] {
  console.log('Analytics data count:', analyticsData.length);
  console.log('Content preferences received in processor:', contentPreferences);
  
  // Process analytics data to extract performance metrics
  const performanceMetrics = analyzeContentPerformance(analyticsData);
  console.log('Performance metrics count:', performanceMetrics.length);
  
  // If we only need to extract metrics, return them here
  if (extractMetricsOnly) {
    return performanceMetrics;
  }
  
  // Sort metrics by engagement rate (highest first)
  const sortedMetrics = [...performanceMetrics].sort((a, b) => b.engagementRate - a.engagementRate);
  
  // Generate calendar suggestions
  const suggestions: AnalyticsBasedRecommendation[] = [];
  const usedDates = new Set<string>();
  
  // Calculate the number of days in the date range
  const dayDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate the number of months in the date range
  const monthDiff = (endDate.getMonth() - startDate.getMonth()) + 
                   (12 * (endDate.getFullYear() - startDate.getFullYear())) + 1;
  
  // Default preferences if none provided
  const defaultPreferences: ContentPreferences = {
    monthlyTotal: 30,
    platformQuotas: Object.fromEntries(
      Object.keys(platformContentTypeMap).map(platform => [platform, platform === 'twitter' || platform === 'instagram' || platform === 'tiktok' ? 8 : 4])
    ),
    enabledPlatforms: Object.keys(platformContentTypeMap),
  };
  
  // Use provided preferences or defaults
  const prefs = contentPreferences || defaultPreferences;
  console.log('Using preferences:', prefs);
  
  // Calculate total content pieces for the entire date range
  const totalContentPieces = prefs.monthlyTotal * monthDiff;
  console.log('Total content pieces to generate:', totalContentPieces);
  
  // Track platform counts to respect quotas
  const platformCounts: Record<string, number> = {};
  prefs.enabledPlatforms.forEach(platform => {
    platformCounts[platform] = 0;
  });
  
  // Calculate monthly quota for each platform
  const monthlyQuotas: Record<string, number> = {};
  prefs.enabledPlatforms.forEach(platform => {
    monthlyQuotas[platform] = prefs.platformQuotas[platform] || 0;
  });
  console.log('Monthly quotas:', monthlyQuotas);
  console.log('Enabled platforms:', prefs.enabledPlatforms);
  
  // For each performance metric, generate a suggestion
  for (const metric of sortedMetrics) {
    // Skip if we've already generated enough suggestions
    if (suggestions.length >= totalContentPieces) {
      console.log('Skipping metric: reached total content pieces limit');
      continue;
    }
    
    // Skip if platform is not enabled
    if (!prefs.enabledPlatforms.includes(metric.platform)) {
      console.log(`Skipping metric for platform ${metric.platform}: platform not enabled`);
      continue;
    }
    
    // Skip if we've reached the quota for this platform
    const monthlyQuota = monthlyQuotas[metric.platform] || 0;
    const totalQuota = monthlyQuota * monthDiff;
    if ((platformCounts[metric.platform] || 0) >= totalQuota) {
      console.log(`Skipping metric for platform ${metric.platform}: reached quota of ${totalQuota}`);
      continue;
    }
    
    console.log(`Processing metric for platform ${metric.platform}, topic ${metric.topic}`);
    
    // Get compatible content types for this platform
    const compatibleTypes = platformContentTypeMap[metric.platform] || ["blog_post"];
    
    // If the metric's content type isn't compatible with the platform, use a compatible one
    const contentType = compatibleTypes.includes(metric.contentType) 
      ? metric.contentType 
      : compatibleTypes[0];
    
    // Ensure contentType is always a string
    const safeContentType = contentType || "blog_post";
    
    // Generate a suggested date and time
    const { suggestedDate, suggestedTime } = generateSuggestedDateTime(
      startDate,
      endDate,
      metric.bestDayOfWeek !== undefined ? metric.bestDayOfWeek : 1,
      metric.bestTimeOfDay !== undefined ? metric.bestTimeOfDay : "09:00",
      usedDates
    );
    
    // Skip if we couldn't find an available date
    if (!suggestedDate) continue;
    
    // Generate a rationale for the suggestion
    const rationale = generateRationale(metric, safeContentType, suggestedDate, suggestedTime);
    
    // Add the suggestion
    suggestions.push({
      contentType: safeContentType,
      topic: metric.topic,
      platform: metric.platform,
      recommendedDate: suggestedDate,
      recommendedTime: suggestedTime,
      rationale,
      predictedEngagement: metric.engagementRate,
      sourceAnalyticsIds: analyticsData.map(item => item.id),
    });
    
    // Increment the platform count
    platformCounts[metric.platform] = (platformCounts[metric.platform] || 0) + 1;
    console.log(`Added suggestion for ${metric.platform}, count now ${platformCounts[metric.platform]}/${totalQuota}`);
    
    // Mark this date as used
    usedDates.add(suggestedDate.toDateString());
  }
  
  // Sort suggestions by date
  const sortedSuggestions = suggestions.sort((a, b) => a.recommendedDate.getTime() - b.recommendedDate.getTime());
  console.log(`Total suggestions generated: ${sortedSuggestions.length}`);
  console.log('Platform distribution:', Object.entries(platformCounts).map(([platform, count]) => `${platform}: ${count}`).join(', '));
  return sortedSuggestions;
}

/**
 * Generates a suggested date and time for posting
 */
function generateSuggestedDateTime(
  startDate: Date,
  endDate: Date,
  preferredDay: number = 1,
  preferredTime: string = "09:00",
  usedDates: Set<string>
): { suggestedDate: Date | null, suggestedTime: string } {
  // Clone the start date to avoid modifying the original
  let currentDate = new Date(startDate);
  
  // Try to find a date with the preferred day of week
  while (currentDate <= endDate) {
    // If this is the preferred day of week and the date isn't already used
    if (currentDate.getDay() === preferredDay && !usedDates.has(currentDate.toDateString())) {
      return {
        suggestedDate: new Date(currentDate),
        suggestedTime: preferredTime,
      };
    }
    
    // Move to the next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // If we couldn't find a date with the preferred day, try any available date
  currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    if (!usedDates.has(currentDate.toDateString())) {
      return {
        suggestedDate: new Date(currentDate),
        suggestedTime: preferredTime,
      };
    }
    
    // Move to the next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // If all dates are used, return null
  return {
    suggestedDate: null,
    suggestedTime: preferredTime,
  };
}

/**
 * Generates a rationale for a content suggestion
 */
function generateRationale(
  metric: ContentPerformanceMetrics,
  contentType: string,
  suggestedDate: Date,
  suggestedTime: string
): string {
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayName = dayNames[suggestedDate.getDay()];
  
  const formattedContentType = contentType.replace(/_/g, ' ');
  const platform = metric.platform || "this platform";
  const topic = metric.topic || "this topic";
  
  return `Based on your content analytics, ${topic} content performs well on ${platform} with an engagement rate of ${metric.engagementRate}. 
  ${dayName}s at ${suggestedTime} is an optimal time for ${platform} posts. 
  A ${formattedContentType} about ${topic} is recommended to maximize engagement with your audience.`;
} 