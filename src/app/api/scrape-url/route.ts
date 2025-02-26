import { type NextRequest } from 'next/server';
import { scrapePuppeteer } from '@/utils/scrapers/puppeteerScraper';

interface RequestBody {
  url: string;
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

    const result = await scrapePuppeteer(body.url);
    return new Response(JSON.stringify(result));
  } catch (e) {
    console.error('Error in scrape-url API:', e);
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