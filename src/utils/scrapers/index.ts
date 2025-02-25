import { scrapeWithPuppeteer } from './puppeteerScraper';

export type ScraperMethod = 'puppeteer';

export interface ScraperResult {
  success: boolean;
  data: any;
  message: string;
  errorDetails?: {
    message?: string;
    stack?: string;
    name?: string;
  };
}

/**
 * Scrape a URL using Puppeteer
 * @param url The URL to scrape
 * @returns The scraping result
 */
export async function scrapeUrl(url: string): Promise<ScraperResult> {
  // Validate URL
  try {
    new URL(url);
  } catch (error) {
    return {
      success: false,
      data: null,
      message: 'Invalid URL provided',
      errorDetails: {
        message: error instanceof Error ? error.message : 'Invalid URL format',
      }
    };
  }
  
  // Use Puppeteer for scraping
  return scrapeWithPuppeteer(url);
}

export { scrapeWithPuppeteer }; 