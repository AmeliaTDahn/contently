import { scrapePuppeteer } from './puppeteerScraper';
import { scrapeServerless } from './serverlessScraper';

export type ScraperMethod = 'puppeteer' | 'serverless';

export interface ScrapedContent {
  metadata: {
    title: string;
    description: string;
    keywords: string[];
    author: string;
    ogImage: string;
  };
  headings: {
    h1Tags: string[];
    headings: string[];
  };
  links: Array<{
    text: string;
    href: string;
    originalHref: string;
  }>;
  images: Array<{
    src: string;
    alt: string;
  }>;
  tables: Array<{
    headers: string[];
    rows: string[][];
  }>;
  structuredData: Record<string, unknown>[];
  mainContent: string;
  screenshot?: string;
}

export interface ScraperError {
  name: string;
  message: string;
  stack?: string;
  errorDetails?: string;
}

export interface ScraperResult {
  content?: ScrapedContent;
  error?: ScraperError;
}

/**
 * Scrape a URL using the specified method
 * @param url The URL to scrape
 * @returns The scraping result
 */
export const scrapeContent = async (url: string, method: ScraperMethod = 'serverless'): Promise<ScraperResult> => {
  try {
    let rawResult: any;
    switch (method) {
      case 'puppeteer':
        rawResult = await scrapePuppeteer(url);
        break;
      case 'serverless':
        rawResult = await scrapeServerless(url);
        break;
      default:
        return {
          error: {
            name: 'UnsupportedMethodError',
            message: `Unsupported scraping method: ${String(method)}`
          }
        };
    }

    const normalizedResult: ScraperResult = {
      error: rawResult.error,
      content: rawResult.content
        ? {
            metadata: {
              title: rawResult.content.metadata?.title ?? '',
              description: rawResult.content.metadata?.description ?? '',
              keywords: Array.isArray(rawResult.content.metadata?.keywords) ? rawResult.content.metadata.keywords : [],
              author: rawResult.content.metadata?.author ?? '',
              ogImage: rawResult.content.metadata?.ogImage ?? ''
            },
            headings: rawResult.content.headings ?? { h1Tags: [], headings: [] },
            links: rawResult.content.links ?? [],
            images: rawResult.content.images ?? [],
            tables: rawResult.content.tables ?? [],
            structuredData: rawResult.content.structuredData ?? [],
            mainContent: rawResult.content.mainContent ?? '',
            screenshot: rawResult.content.screenshot
          }
        : undefined
    };

    return normalizedResult;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error scraping content:', error);
      return {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      };
    }
    return {
      error: {
        name: 'UnknownError',
        message: 'An unknown error occurred while scraping content'
      }
    };
  }
};

export { scrapePuppeteer, scrapeServerless }; 