import { type NextRequest } from 'next/server';
import { scrapePlaywright } from '@/utils/scrapers/playwrightScraper';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400 }
      );
    }

    const result = await scrapePlaywright(url);
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.error('Error scraping URL:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to scrape URL',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500 }
    );
  }
} 