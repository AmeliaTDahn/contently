import { scrapeWithCheerio } from './cheerioScraper';
import { scrapeWithPuppeteer } from './puppeteerScraper';

export type ScraperMethod = 'cheerio' | 'puppeteer';

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
 * Scrape a URL using the specified method
 * @param url The URL to scrape
 * @param method The scraping method to use (cheerio or puppeteer)
 * @returns The scraping result
 */
export async function scrapeUrl(url: string, method: ScraperMethod = 'puppeteer'): Promise<ScraperResult> {
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
  
  // Choose scraping method
  switch (method) {
    case 'cheerio':
      return scrapeWithCheerio(url);
    case 'puppeteer':
      return scrapeWithPuppeteer(url);
    default:
      return {
        success: false,
        data: null,
        message: `Invalid scraper method: ${method}`,
        errorDetails: {
          message: `Method must be 'cheerio' or 'puppeteer', received: ${method}`,
        }
      };
  }
}

export { scrapeWithCheerio, scrapeWithPuppeteer }; 