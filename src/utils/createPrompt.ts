export function createCalendarPrompt(
    aggregatedAnalytics: {
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
    },
    preferences: { postsPerMonth: number; contentTypes: string[] }
  ): string {
    const { contentTypeStats, topTopics, globalInsights, keywordAnalysis, engagementPatterns } = aggregatedAnalytics;
    const { postsPerMonth, contentTypes } = preferences;
  
    let prompt = `You are an expert content strategist analyzing a specific set of URLs to create a highly focused content calendar. Your task is to generate content suggestions that are STRICTLY based on the themes and topics found in the analyzed URLs. DO NOT generate generic content or topics not directly related to the analyzed content.

IMPORTANT: You must stay within the exact topic areas found in the analyzed URLs. For example, if the URLs are about content optimization and recipes, ALL suggestions must be about content optimization or recipes - no generic topics like "morning routines" or "fitness tips" unless these are explicitly present in the analyzed content.

Here is the analysis of the specific URLs and their content:\n\n`;
  
    // Add historical content performance with emphasis on specific topics
    prompt += `Exact Topics and Themes from Analyzed URLs:\n`;
    for (const [type, stats] of Object.entries(contentTypeStats)) {
      prompt += `${type}:\n`;
      prompt += `- Content focus: ${stats.bestPerformingTopics.join(', ')}\n`;
      prompt += `- Current content metrics: ${stats.count} pieces published, engagement: ${stats.avgEngagement.toFixed(1)}, readability: ${stats.avgReadability.toFixed(1)}, SEO: ${stats.avgSeo.toFixed(1)}\n`;
      prompt += `- Writing style: ${stats.tone} tone for ${stats.audienceLevel} audience\n`;
      prompt += `- Best publishing time: ${stats.bestTimeOfDay}\n`;
    }
  
    // Add core topic areas
    prompt += `\nCore Topic Areas (ONLY suggest content within these areas):\n`;
    prompt += `- Primary themes: ${topTopics.join(', ')}\n`;
    prompt += `- Established subtopics: ${globalInsights.audiencePreferences.interests.join(', ')}\n`;
    prompt += `- Current content gaps within these themes: ${globalInsights.contentGaps.join(', ')}\n`;
  
    // Add keyword insights specific to existing content
    prompt += `\nKeywords from Analyzed Content:\n`;
    prompt += `- Currently successful: ${keywordAnalysis.trending.join(', ')}\n`;
    prompt += `- Underexplored aspects: ${keywordAnalysis.underutilized.join(', ')}\n`;
    prompt += `- Well-covered areas: ${keywordAnalysis.overused.join(', ')}\n`;
  
    // Add seasonal patterns specific to content themes
    prompt += `\nSeasonal Patterns in Current Content:\n`;
    for (const trend of globalInsights.seasonalTrends) {
      prompt += `- ${trend.season} focus areas: ${trend.topics.join(', ')}\n`;
    }
  
    // Add engagement data
    prompt += `\nPublishing Schedule (based on current content):\n`;
    prompt += `- Most engaging times: ${Object.entries(engagementPatterns.timeOfDay)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([time]) => time)
      .join(', ')}\n`;
    prompt += `- Best performing days: ${Object.entries(engagementPatterns.dayOfWeek)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([day]) => day)
      .join(', ')}\n`;
  
    prompt += `\nCreate a ${postsPerMonth * 3}-post content calendar for the next 3 months using these content types: ${contentTypes.join(
      ', '
    )}. 

CRITICAL REQUIREMENTS:
1. ONLY suggest topics that are direct extensions of the analyzed content themes
2. DO NOT include any generic topics or themes not found in the analyzed URLs
3. Each suggestion must clearly relate to one of the core topics identified above
4. Stay strictly within the established content areas - no branching into unrelated subjects

For each post, provide:
- Date (YYYY-MM-DD)
- Content Type (from specified types)
- Topic (must be directly related to analyzed content)
- Rationale (explain specifically which analyzed content this builds upon and how it extends those exact themes)

Example format (adjust topics to match your actual analyzed content):
{
  "calendar": [
    {
      "date": "2024-04-01",
      "contentType": "blog",
      "topic": "Advanced Content Optimization Techniques for E-commerce Pages",
      "rationale": "Builds upon our existing content optimization guide, focusing on the e-commerce aspect mentioned in URL #3..."
    },
    {
      "date": "2024-04-03",
      "contentType": "blog",
      "topic": "Spring Mediterranean Recipe Collection",
      "rationale": "Expands on our Mediterranean cooking series from URL #2, incorporating seasonal ingredients..."
    }
  ]
}

Return the response as a JSON object with a "calendar" array. Every suggestion must have a clear, direct connection to the analyzed URLs.`;
  
    return prompt;
  }