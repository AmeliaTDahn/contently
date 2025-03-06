import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ContentMetadata {
  title: string;
  description?: string;
  author?: string;
  date?: string;
  url?: string;
}

interface ContentToAnalyze {
  title: string;
  content: string;
  metadata: ContentMetadata;
}

interface ContentAnalysis {
  engagementScore: number;
  contentQualityScore: number;
  readabilityScore: number;
  seoScore: number;
  insights: {
    engagement: string[];
    content: string[];
    readability: string[];
    seo: string[];
  };
  industry: string;
  scope: string;
  topics: string[];
  writingQuality: {
    grammar: number;
    clarity: number;
    structure: number;
    vocabulary: number;
    overall: number;
  };
  audienceLevel: string;
  contentType: string;
  tone: string;
  estimatedReadTime: number;
  keywords: Array<{
    text: string;
    count: number;
  }>;
  keywordAnalysis: {
    distribution: string;
    overused: string[];
    underused: string[];
  };
}

export async function analyzeContentWithAI(content: ContentToAnalyze): Promise<ContentAnalysis> {
  const prompt = `
    Please analyze this content and provide detailed insights:
    
    Title: ${content.title}
    Content: ${content.content}
    ${content.metadata.description ? `Description: ${content.metadata.description}` : ''}
    ${content.metadata.author ? `Author: ${content.metadata.author}` : ''}
    ${content.metadata.date ? `Date: ${content.metadata.date}` : ''}
    ${content.metadata.url ? `URL: ${content.metadata.url}` : ''}
    
    Provide a comprehensive analysis including:
    - Engagement potential (score and insights)
    - Content quality (score and insights)
    - Readability (score and insights)
    - SEO optimization (score and insights)
    - Industry and scope
    - Main topics
    - Writing quality metrics
    - Target audience level
    - Content type and tone
    - Keyword analysis
    
    Return the analysis in a structured JSON format matching the ContentAnalysis interface.
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert content analyst. Analyze the provided content and return detailed insights in JSON format.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No analysis received from OpenAI');
    }

    const analysis = JSON.parse(content);

    // Ensure all required fields are present with default values if missing
    return {
      engagementScore: analysis.engagementScore || 0,
      contentQualityScore: analysis.contentQualityScore || 0,
      readabilityScore: analysis.readabilityScore || 0,
      seoScore: analysis.seoScore || 0,
      insights: {
        engagement: analysis.insights?.engagement || [],
        content: analysis.insights?.content || [],
        readability: analysis.insights?.readability || [],
        seo: analysis.insights?.seo || [],
      },
      industry: analysis.industry || 'General',
      scope: analysis.scope || 'General',
      topics: analysis.topics || [],
      writingQuality: {
        grammar: analysis.writingQuality?.grammar || 0,
        clarity: analysis.writingQuality?.clarity || 0,
        structure: analysis.writingQuality?.structure || 0,
        vocabulary: analysis.writingQuality?.vocabulary || 0,
        overall: analysis.writingQuality?.overall || 0,
      },
      audienceLevel: analysis.audienceLevel || 'General',
      contentType: analysis.contentType || 'Article',
      tone: analysis.tone || 'Neutral',
      estimatedReadTime: analysis.estimatedReadTime || 0,
      keywords: analysis.keywords || [],
      keywordAnalysis: {
        distribution: analysis.keywordAnalysis?.distribution || '',
        overused: analysis.keywordAnalysis?.overused || [],
        underused: analysis.keywordAnalysis?.underused || [],
      },
    };
  } catch (error) {
    console.error('Error analyzing content with AI:', error);
    throw error;
  }
} 