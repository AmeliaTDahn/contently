import { analyzeContentWithAI } from '../utils/openai';
import { scrapeContent } from '../utils/scrapers';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface PostSuggestion {
  title: string;
  description: string;
  topics: string[];
  audienceLevel: string;
  contentType: string;
  tone: string;
  explanation: string;
}

function getMostCommon(arr: (string | undefined)[]): string | null {
  const validValues = arr.filter((val): val is string => val !== undefined);
  if (validValues.length === 0) return null;
  const frequencyMap = validValues.reduce((acc, val) => {
    acc.set(val, (acc.get(val) || 0) + 1);
    return acc;
  }, new Map<string, number>());
  let maxCount = 0;
  let mostCommon = null;
  for (const [key, count] of frequencyMap) {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = key;
    }
  }
  return mostCommon;
}

export async function generatePostSuggestions(urls: string[]): Promise<PostSuggestion[]> {
  // Analyze each URL
  const analyses = await Promise.all(
    urls.map(async (url) => {
      const scraped = await scrapeContent(url);
      if (scraped.error) {
        throw new Error(scraped.error.message);
      }
      const analysis = await analyzeContentWithAI({
        title: scraped.content!.metadata.title,
        content: scraped.content!.mainContent,
        metadata: scraped.content!.metadata,
      });
      return analysis;
    })
  );

  // Aggregate topics, keywords, and other metadata
  const allTopics = analyses.flatMap((a) => a.topics || []);
  const allKeywords = analyses.flatMap((a) => a.keywords || []).map((k) => k.text);
  const industries = analyses.map((a) => a.industry).filter(Boolean);
  const audienceLevels = analyses.map((a) => a.audienceLevel).filter(Boolean);
  const contentTypes = analyses.map((a) => a.contentType).filter(Boolean);
  const tones = analyses.map((a) => a.tone).filter(Boolean);

  const mostCommonIndustry = getMostCommon(industries) || 'General';
  const mostCommonAudienceLevel = getMostCommon(audienceLevels) || 'General';
  const mostCommonContentType = getMostCommon(contentTypes) || 'Article';
  const mostCommonTone = getMostCommon(tones) || 'Neutral';

  // Create AI prompt for generating suggestions
  const prompt = `
    Based on the analysis of multiple articles, here are the main topics and keywords:
    
    Topics: ${JSON.stringify(allTopics.slice(0, 10))}
    Keywords: ${JSON.stringify(allKeywords.slice(0, 20))}
    Industry: ${mostCommonIndustry}
    Audience Level: ${mostCommonAudienceLevel}
    Content Type: ${mostCommonContentType}
    Tone: ${mostCommonTone}
    
    Please suggest 5 relevant post ideas for a content calendar. Each suggestion should include:
    - title: string
    - description: string
    - topics: string[]
    - audienceLevel: string
    - contentType: string
    - tone: string
    - explanation: string (why this post is relevant)
    
    Return the suggestions in a JSON array. Ensure suggestions are directly related to the provided topics and keywords.
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert content strategist. Generate post ideas that are directly related to the provided topics and keywords, suitable for the specified industry and audience level.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    if (!completion.choices[0]?.message?.content) {
      throw new Error('No response from OpenAI');
    }

    const suggestions = JSON.parse(completion.choices[0].message.content) as PostSuggestion[];
    return suggestions;
  } catch (error) {
    console.error('Error generating post suggestions:', error);
    return [];
  }
}