import { type NextRequest } from 'next/server';
import { scrapePuppeteer } from '@/utils/scrapers/puppeteerScraper';
import { analyzeKeywordUsage } from '@/utils/keywords';
import { analyzeTopicCoherence } from '@/utils/topics';

interface RequestBody {
  url: string;
}

interface AnalysisResult {
  keywords: string[];
  keywordAnalysis: {
    distribution: number;
    overuse: string[];
    underuse: string[];
  };
  topicCoherence: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as RequestBody;
    
    if (!body.url || typeof body.url !== 'string') {
      return new Response(
        JSON.stringify({
          error: {
            name: 'ValidationError',
            message: 'URL is required and must be a string'
          }
        }),
        { status: 400 }
      );
    }

    // First, scrape the content
    const result = await scrapePuppeteer(body.url);
    
    if (result.error) {
      return new Response(JSON.stringify(result), { status: 500 });
    }

    if (!result.content) {
      return new Response(
        JSON.stringify({
          error: {
            name: 'ScrapingError',
            message: 'Failed to extract content from URL'
          }
        }),
        { status: 500 }
      );
    }

    // Analyze the content
    const { mainContent } = result.content;
    const keywords = mainContent.split(/\s+/).slice(0, 10); // Simple keyword extraction
    const keywordAnalysis = analyzeKeywordUsage(mainContent, keywords);
    const topicCoherence = analyzeTopicCoherence(mainContent, result.content.metadata.title ?? '');

    const analysis: AnalysisResult = {
      keywords,
      keywordAnalysis,
      topicCoherence
    };

    return new Response(JSON.stringify(analysis));
  } catch (e) {
    console.error('Error in analyze-content API:', e);
    return new Response(
      JSON.stringify({
        error: {
          name: e instanceof Error ? e.name : 'UnknownError',
          message: e instanceof Error ? e.message : 'An unknown error occurred',
          stack: e instanceof Error ? e.stack : undefined
        }
      }),
      { status: 500 }
    );
  }
} 