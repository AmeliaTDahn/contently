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
    preferences: { 
      postsPerMonth: number; 
      contentTypes: string[];
      customPrompt?: string;
      contentPlan?: Record<string, number>;
    }
  ): string {
    const { contentTypeStats, topTopics, globalInsights, keywordAnalysis, engagementPatterns } = aggregatedAnalytics;
    const { postsPerMonth, contentTypes, customPrompt } = preferences;
  
    let prompt = `You are an expert content strategist analyzing a specific set of URLs to create a highly focused content calendar. Your task is to generate content suggestions that are STRICTLY based on the themes and topics found in the analyzed URLs. DO NOT generate generic content or topics not directly related to the analyzed content.

IMPORTANT: You must stay within the exact topic areas found in the analyzed URLs. For example, if the URLs are about content optimization and recipes, ALL suggestions must be about content optimization or recipes - no generic topics like "morning routines" or "fitness tips" unless these are explicitly present in the analyzed content.

${customPrompt ? `CUSTOM REQUIREMENTS: ${customPrompt}\n\n` : ''}Here is the analysis of the specific URLs and their content:\n\n`;
  
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
  
    prompt += `\nCreate a content calendar for the next month with EXACTLY the following distribution:
${contentTypes.map(type => `- ${type}: ${preferences.contentPlan?.[type] || 0} posts`).join('\n')}

CRITICAL REQUIREMENTS:
1. Generate EXACTLY ${Object.values(preferences.contentPlan || {}).reduce((sum, count) => sum + count, 0)} posts in total - no more, no less
2. Generate EXACTLY the number of posts specified for each content type:
${contentTypes.map(type => `   - ${type}: MUST have ${preferences.contentPlan?.[type] || 0} posts`).join('\n')}
3. All posts must be scheduled within the next month (30 days) from tomorrow
4. ONLY suggest topics that are direct extensions of the analyzed content themes
5. DO NOT include any generic topics or themes not found in the analyzed URLs
6. Each suggestion must clearly relate to one of the core topics identified above
7. Stay strictly within the established content areas - no branching into unrelated subjects
8. WARNING: The response will be validated to ensure exact post counts match. Any mismatch will cause an error.
${customPrompt ? `9. IMPORTANT: ${customPrompt}` : ''}

For each post, provide:
- Date (YYYY-MM-DD format, must be within the next 30 days)
- Content Type (must match one of: ${contentTypes.join(', ')})
- Topic (must be directly related to analyzed content)
- Description (provide a comprehensive 3-4 sentence explanation including: main points to cover, target audience takeaways, suggested content structure, and any specific examples or case studies to include)
- Rationale (write a detailed 3-4 sentence explanation that references: specific analyzed URLs that inspired this content, performance metrics that support this choice, identified content gaps this fills, and how it aligns with audience preferences)

Example format (adjust topics to match your actual analyzed content):
{
  "calendar": [
    {
      "date": "2024-03-05",
      "contentType": "blog",
      "topic": "Advanced Content Optimization Techniques for E-commerce Pages",
      "description": "A comprehensive guide that walks through advanced optimization strategies for e-commerce product pages and category listings. The content will cover key areas including metadata optimization, schema markup implementation, and content hierarchy best practices with real examples from successful e-commerce sites. Readers will learn how to implement these techniques through step-by-step instructions and receive a downloadable checklist for optimizing their own pages.",
      "rationale": "This topic builds upon our existing content optimization guide (URL #3) which has shown high engagement (85% read-through rate) but lacked e-commerce-specific examples. Analytics show our e-commerce-related content consistently outperforms other topics with 2.3x higher conversion rates. This fills a significant content gap in our technical SEO coverage and aligns with our audience's demonstrated interest in actionable, industry-specific optimization techniques."
    }
  ]
}

Return the response as a JSON object with a "calendar" array. Every suggestion must have a clear, direct connection to the analyzed URLs.`;
  
    return prompt;
  }