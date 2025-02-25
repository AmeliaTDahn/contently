import { NextRequest, NextResponse } from 'next/server';
import { scrapeUrl, ScraperMethod } from '@/utils/scrapers';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { url, method = 'puppeteer' } = body;
    
    // Validate input
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }
    
    // Validate method
    if (method !== 'cheerio' && method !== 'puppeteer') {
      return NextResponse.json(
        { error: 'Invalid scraper method. Use "cheerio" or "puppeteer"' },
        { status: 400 }
      );
    }
    
    // Perform scraping
    console.log(`API: Starting scraping of ${url} using ${method}...`);
    const result = await scrapeUrl(url, method as ScraperMethod);
    
    // Return result
    if (result.success) {
      console.log(`API: Scraping of ${url} completed successfully`);
      return NextResponse.json(result);
    } else {
      console.error(`API: Scraping of ${url} failed:`, result.message);
      // Include detailed error information if available
      return NextResponse.json(
        { 
          error: result.message,
          errorDetails: result.errorDetails || null,
          url,
          method
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in scrape API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to scrape the URL';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      { 
        error: errorMessage,
        stack: errorStack,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 