import OpenAI from 'openai';
import { type AnalyticsResult, type EngagementMetrics } from '@/app/api/analyze-content/route';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ContentAnalysisPrompt {
  content: string;
  title: string;
  metadata: {
    description?: string;
    keywords?: string[] | string;
    author?: string;
  };
}

interface AIAnalysisResponse {
  writingQuality: {
    grammar: number;
    clarity: number;
    structure: number;
    vocabulary: number;
    overall: number;
    explanations: {
      grammar: string;
      clarity: string;
      structure: string;
      vocabulary: string;
      overall: string;
    };
  };
  contentQualityScore: number;
  contentQualityExplanation: string;
  readabilityScore: number;
  readabilityExplanation: string;
  seoScore: number;
  seoExplanation: string;
  engagementScore: number;
  engagementExplanation: string;
  industry: string;
  industryExplanation: string;
  scope: string;
  scopeExplanation: string;
  topics: string[];
  topicsExplanation: string;
  audienceLevel: string;
  audienceLevelExplanation: string;
  contentType: string;
  contentTypeExplanation: string;
  tone: string;
  toneExplanation: string;
  keywords: Array<{
    text: string;
    count: number;
  }>;
  insights: {
    engagement: string[];
    content: string[];
    readability: string[];
    seo: string[];
  };
  keywordAnalysis: {
    distribution: string;
    overused: string[];
    underused: string[];
    explanation: string;
  };
  stats: {
    wordCountStats: {
      count: number;
      min: number;
      max: number;
      avg: number;
      sum: number;
      explanations: {
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
      explanation: string;
    }>;
  };
}

export async function analyzeContentWithAI(
  data: ContentAnalysisPrompt
): Promise<Partial<AnalyticsResult>> {
  const prompt = `
    Analyze the following content and provide detailed insights. For each metric, include an explanation of why you assigned that specific value. Return a JSON object with the following structure:
    {
      "writingQuality": {
        "grammar": number (0-100),
        "clarity": number (0-100),
        "structure": number (0-100),
        "vocabulary": number (0-100),
        "overall": number (0-100),
        "explanations": {
          "grammar": "Explanation of grammar score...",
          "clarity": "Explanation of clarity score...",
          "structure": "Explanation of structure score...",
          "vocabulary": "Explanation of vocabulary score...",
          "overall": "Explanation of overall score..."
        }
      },
      "contentQualityScore": number (0-100),
      "contentQualityExplanation": "Explanation of content quality score...",
      "readabilityScore": number (0-100),
      "readabilityExplanation": "Explanation of readability score...",
      "seoScore": number (0-100),
      "seoExplanation": "Explanation of SEO score...",
      "engagementScore": number (0-100),
      "engagementExplanation": "Explanation of engagement score...",
      "industry": "string",
      "industryExplanation": "Explanation of industry classification...",
      "scope": "string",
      "scopeExplanation": "Explanation of scope determination...",
      "topics": ["string"],
      "topicsExplanation": "Explanation of topic selection...",
      "audienceLevel": "string",
      "audienceLevelExplanation": "Explanation of audience level determination...",
      "contentType": "string",
      "contentTypeExplanation": "Explanation of content type classification...",
      "tone": "string",
      "toneExplanation": "Explanation of tone analysis...",
      "keywords": [
        {
          "text": "keyword1",
          "count": number
        },
        {
          "text": "keyword2",
          "count": number
        }
      ],
      "insights": {
        "engagement": ["string"],
        "content": ["string"],
        "readability": ["string"],
        "seo": ["string"]
      },
      "keywordAnalysis": {
        "distribution": "string",
        "overused": ["string"],
        "underused": ["string"],
        "explanation": "Explanation of keyword analysis..."
      },
      "stats": {
        "wordCountStats": {
          "count": number,
          "min": number,
          "max": number,
          "avg": number,
          "sum": number,
          "explanations": {
            "count": "Explanation of total articles count...",
            "min": "Explanation of minimum word count...",
            "max": "Explanation of maximum word count...",
            "avg": "Explanation of average word count...",
            "sum": "Explanation of total word count..."
          }
        },
        "articlesPerMonth": [
          {
            "date": "YYYY-MM",
            "count": number,
            "explanation": "Explanation of article count for this month..."
          }
        ]
      }
    }

    Content to analyze:
    Title: ${data.title}
    Description: ${data.metadata.description || 'N/A'}
    Keywords: ${data.metadata.keywords || 'N/A'}
    Author: ${data.metadata.author || 'N/A'}
    
    Content:
    ${data.content}
    
    IMPORTANT: You MUST extract and include the top 5-10 keywords from the content with their occurrence counts in the 'keywords' array. Each keyword should be an object with 'text' and 'count' properties. The 'text' property should be the keyword itself, and the 'count' property should be the number of times it appears in the content.
    
    IMPORTANT: For the insights section, provide highly specific, actionable insights that directly reference the content being analyzed. Each insight should:
    1. Reference specific sections, phrases, or elements from the content
    2. Include concrete, actionable recommendations (not generic advice)
    3. Explain the potential impact of implementing the recommendation
    4. Be tailored to the specific industry, audience, and content type
    
    For example, instead of "Improve readability with shorter paragraphs", provide: "The section discussing [specific topic] uses paragraphs averaging 8-10 sentences, making it difficult for online readers to scan. Breaking the paragraph starting with '[specific text]' into 2-3 shorter paragraphs would improve readability by 15-20% for your [specific audience] audience."
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are an expert content analyzer. Analyze the given content and provide detailed insights in the exact JSON format specified. All scores should be numbers between 0-100. IMPORTANT: Always extract and include the top 5-10 keywords from the content with their occurrence counts in the 'keywords' array. For insights, provide highly specific, actionable recommendations that directly reference the content being analyzed - not generic advice."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    if (!completion.choices[0]?.message?.content) {
      throw new Error('No response from OpenAI');
    }

    const analysis = JSON.parse(completion.choices[0].message.content) as AIAnalysisResponse;

    // Validate and transform the AI response
    return {
      writingQuality: {
        grammar: Math.min(100, Math.max(0, analysis.writingQuality?.grammar ?? 0)),
        clarity: Math.min(100, Math.max(0, analysis.writingQuality?.clarity ?? 0)),
        structure: Math.min(100, Math.max(0, analysis.writingQuality?.structure ?? 0)),
        vocabulary: Math.min(100, Math.max(0, analysis.writingQuality?.vocabulary ?? 0)),
        overall: Math.min(100, Math.max(0, analysis.writingQuality?.overall ?? 0)),
        explanations: analysis.writingQuality?.explanations ?? {
          grammar: '',
          clarity: '',
          structure: '',
          vocabulary: '',
          overall: ''
        }
      },
      contentQualityScore: Math.min(100, Math.max(0, analysis.contentQualityScore ?? 0)),
      contentQualityExplanation: analysis.contentQualityExplanation ?? '',
      readabilityScore: Math.min(100, Math.max(0, analysis.readabilityScore ?? 0)),
      readabilityExplanation: analysis.readabilityExplanation ?? '',
      seoScore: Math.min(100, Math.max(0, analysis.seoScore ?? 0)),
      seoExplanation: analysis.seoExplanation ?? '',
      engagementScore: Math.min(100, Math.max(0, analysis.engagementScore ?? 0)),
      engagementExplanation: analysis.engagementExplanation ?? '',
      industry: analysis.industry || 'General',
      industryExplanation: analysis.industryExplanation ?? '',
      scope: analysis.scope || 'General',
      scopeExplanation: analysis.scopeExplanation ?? '',
      topics: analysis.topics || [],
      topicsExplanation: analysis.topicsExplanation ?? '',
      audienceLevel: analysis.audienceLevel || 'General',
      audienceLevelExplanation: analysis.audienceLevelExplanation ?? '',
      contentType: analysis.contentType || 'Article',
      contentTypeExplanation: analysis.contentTypeExplanation ?? '',
      tone: analysis.tone || 'Neutral',
      toneExplanation: analysis.toneExplanation ?? '',
      keywords: analysis.keywords || [],
      insights: {
        engagement: analysis.insights?.engagement || [],
        content: analysis.insights?.content || [],
        readability: analysis.insights?.readability || [],
        seo: analysis.insights?.seo || [],
      },
      keywordAnalysis: {
        distribution: analysis.keywordAnalysis?.distribution || '',
        overused: analysis.keywordAnalysis?.overused || [],
        underused: analysis.keywordAnalysis?.underused || [],
        explanation: analysis.keywordAnalysis?.explanation ?? ''
      },
      stats: {
        wordCountStats: {
          count: analysis.stats?.wordCountStats?.count ?? 0,
          min: analysis.stats?.wordCountStats?.min ?? 0,
          max: analysis.stats?.wordCountStats?.max ?? 0,
          avg: analysis.stats?.wordCountStats?.avg ?? 0,
          sum: analysis.stats?.wordCountStats?.sum ?? 0,
          explanations: analysis.stats?.wordCountStats?.explanations ?? {
            count: '',
            min: '',
            max: '',
            avg: '',
            sum: ''
          }
        },
        articlesPerMonth: analysis.stats?.articlesPerMonth?.map(item => ({
          date: item.date,
          count: item.count ?? 0,
          explanation: item.explanation ?? ''
        })) || []
      },
    };
  } catch (error) {
    console.error('Error analyzing content with AI:', error);
    // Return default values if analysis fails
    return {
      writingQuality: {
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
      contentQualityScore: 0,
      contentQualityExplanation: '',
      readabilityScore: 0,
      readabilityExplanation: '',
      seoScore: 0,
      seoExplanation: '',
      engagementScore: 0,
      engagementExplanation: '',
      industry: 'General',
      industryExplanation: '',
      scope: 'General',
      scopeExplanation: '',
      topics: [],
      topicsExplanation: '',
      audienceLevel: 'General',
      audienceLevelExplanation: '',
      contentType: 'Article',
      contentTypeExplanation: '',
      tone: 'Neutral',
      toneExplanation: '',
      keywords: [],
      insights: {
        engagement: [],
        content: [],
        readability: [],
        seo: [],
      },
      keywordAnalysis: {
        distribution: '',
        overused: [],
        underused: [],
        explanation: ''
      },
      stats: {
        wordCountStats: {
          count: 0,
          min: 0,
          max: 0,
          avg: 0,
          sum: 0,
          explanations: {
            count: '',
            min: '',
            max: '',
            avg: '',
            sum: ''
          }
        },
        articlesPerMonth: []
      },
    };
  }
}

interface AIEngagementResponse {
  likes: number;
  likesExplanation: string;
  comments: number;
  commentsExplanation: string;
  shares: number;
  sharesExplanation: string;
  bookmarks: number;
  bookmarksExplanation: string;
  totalViews: number;
  totalViewsExplanation: string;
  uniqueViews: number;
  uniqueViewsExplanation: string;
  avgTimeOnPage: number;
  avgTimeOnPageExplanation: string;
  bounceRate: number;
  bounceRateExplanation: string;
  socialShares: {
    facebook: number;
    twitter: number;
    linkedin: number;
    pinterest: number;
  };
  socialSharesExplanation: string;
}

export async function predictEngagementMetrics(
  content: string,
  analysisResults: Partial<AnalyticsResult>
): Promise<EngagementMetrics> {
  const prompt = `
    Return a JSON object with predicted engagement metrics and explanations for each prediction. Use this exact format:
    {
      "likes": number,
      "likesExplanation": "Explanation of likes prediction...",
      "comments": number,
      "commentsExplanation": "Explanation of comments prediction...",
      "shares": number,
      "sharesExplanation": "Explanation of shares prediction...",
      "bookmarks": number,
      "bookmarksExplanation": "Explanation of bookmarks prediction...",
      "totalViews": number,
      "totalViewsExplanation": "Explanation of total views prediction...",
      "uniqueViews": number,
      "uniqueViewsExplanation": "Explanation of unique views prediction...",
      "avgTimeOnPage": number (in seconds),
      "avgTimeOnPageExplanation": "Explanation of average time prediction...",
      "bounceRate": number (percentage 0-100),
      "bounceRateExplanation": "Explanation of bounce rate prediction...",
      "socialShares": {
        "facebook": number,
        "twitter": number,
        "linkedin": number,
        "pinterest": number
      },
      "socialSharesExplanation": "Explanation of social shares distribution..."
    }

    Base your predictions and explanations on:
    Content Quality Score: ${analysisResults.contentQualityScore ?? 0}
    Readability Score: ${analysisResults.readabilityScore ?? 0}
    SEO Score: ${analysisResults.seoScore ?? 0}
    Industry: ${analysisResults.industry ?? 'General'}
    Audience Level: ${analysisResults.audienceLevel ?? 'General'}
    Content Type: ${analysisResults.contentType ?? 'Article'}
    
    Content Preview:
    ${content.slice(0, 1000)}...
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are an expert in content engagement prediction. For each metric you predict, provide a clear explanation of why you chose that specific value based on the content characteristics and industry standards."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    if (!completion.choices[0]?.message?.content) {
      throw new Error('No response from OpenAI');
    }

    const prediction = JSON.parse(completion.choices[0].message.content) as AIEngagementResponse;

    // Store the explanations in a global object or database for reference
    const explanations = {
      likes: prediction.likesExplanation,
      comments: prediction.commentsExplanation,
      shares: prediction.sharesExplanation,
      bookmarks: prediction.bookmarksExplanation,
      totalViews: prediction.totalViewsExplanation,
      uniqueViews: prediction.uniqueViewsExplanation,
      avgTimeOnPage: prediction.avgTimeOnPageExplanation,
      bounceRate: prediction.bounceRateExplanation,
      socialShares: prediction.socialSharesExplanation
    };

    // Log explanations for debugging and transparency
    console.log('Engagement Predictions Explanations:', explanations);

    // Return the metrics as before
    return {
      likes: Math.max(0, prediction.likes ?? 0),
      comments: Math.max(0, prediction.comments ?? 0),
      shares: Math.max(0, prediction.shares ?? 0),
      bookmarks: Math.max(0, prediction.bookmarks ?? 0),
      totalViews: Math.max(0, prediction.totalViews ?? 0),
      uniqueViews: Math.max(0, prediction.uniqueViews ?? 0),
      avgTimeOnPage: Math.max(0, prediction.avgTimeOnPage ?? 0),
      bounceRate: Math.min(100, Math.max(0, prediction.bounceRate ?? 0)),
      socialShares: {
        facebook: Math.max(0, prediction.socialShares?.facebook ?? 0),
        twitter: Math.max(0, prediction.socialShares?.twitter ?? 0),
        linkedin: Math.max(0, prediction.socialShares?.linkedin ?? 0),
        pinterest: Math.max(0, prediction.socialShares?.pinterest ?? 0),
      },
      explanations: {
        likes: prediction.likesExplanation ?? '',
        comments: prediction.commentsExplanation ?? '',
        shares: prediction.sharesExplanation ?? '',
        bookmarks: prediction.bookmarksExplanation ?? '',
        totalViews: prediction.totalViewsExplanation ?? '',
        uniqueViews: prediction.uniqueViewsExplanation ?? '',
        avgTimeOnPage: prediction.avgTimeOnPageExplanation ?? '',
        bounceRate: prediction.bounceRateExplanation ?? '',
        socialShares: prediction.socialSharesExplanation ?? ''
      }
    };
  } catch (error) {
    console.error('Error predicting engagement metrics:', error);
    // Return default values if prediction fails
    return {
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
        pinterest: 0,
      },
      explanations: {
        likes: '',
        comments: '',
        shares: '',
        bookmarks: '',
        totalViews: '',
        uniqueViews: '',
        avgTimeOnPage: '',
        bounceRate: '',
        socialShares: ''
      }
    };
  }
}

interface CalendarGenerationResponse {
  events: Array<{
    title: string;
    description: string;
    start: string;
    end: string;
    content_type: string;
    action: string;
    rationale: {
      strategic_timing: string;
      audience_benefit: string;
      platform_specific: string;
      content_strategy: string;
      content_guidelines: string[];
      key_points: string[];
    };
  }>;
}

export async function generateCalendarWithAI(
  analysisData: {
    new_content_ideas: Array<{
      topic: string;
      content_type: string | null;
      priority: number;
      reason: string;
    }>;
    refresh_tasks: Array<{
      title: string;
      updates: string;
      priority: number;
      metric: string;
    }>;
  },
  startDate: string,
  durationMonths: number,
  cadence: 'weekly' | 'biweekly' | 'monthly' = 'weekly'
): Promise<CalendarGenerationResponse> {
  const prompt = `
    As an expert content strategist, create a detailed content calendar based on the following inputs:

    Content Ideas:
    ${analysisData.new_content_ideas.map(idea => `
    - Topic: ${idea.topic}
      Type: ${idea.content_type || 'Any'}
      Priority: ${idea.priority}
      Reason: ${idea.reason}
    `).join('\n')}

    Content Refresh Tasks:
    ${analysisData.refresh_tasks.map(task => `
    - Title: ${task.title}
      Updates: ${task.updates}
      Priority: ${task.priority}
      Metric: ${task.metric}
    `).join('\n')}

    Parameters:
    - Start Date: ${startDate}
    - Duration: ${durationMonths} months
    - Publishing Cadence: ${cadence}

    Create a content calendar that:
    1. Prioritizes high-priority content and refresh tasks
    2. Distributes content evenly across the specified duration
    3. Follows the specified publishing cadence
    4. Provides detailed rationale for timing and strategic decisions
    5. Includes specific content guidelines and key points for each item

    Return the response as a JSON object with an "events" array, where each event has:
    - title: string
    - description: string
    - start: string (YYYY-MM-DD format)
    - end: string (YYYY-MM-DD format)
    - content_type: string
    - action: string ('new' or 'refresh')
    - rationale: {
        strategic_timing: string
        audience_benefit: string
        platform_specific: string
        content_strategy: string
        content_guidelines: string[]
        key_points: string[]
      }
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are an expert content strategist creating a detailed content calendar. Focus on strategic timing, audience benefits, and platform-specific considerations. Provide specific, actionable content guidelines and key points for each item."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    if (!completion.choices[0]?.message?.content) {
      throw new Error('No response from OpenAI');
    }

    const calendar = JSON.parse(completion.choices[0].message.content) as CalendarGenerationResponse;
    return calendar;
  } catch (error) {
    console.error('Error generating content calendar:', error);
    throw error;
  }
} 