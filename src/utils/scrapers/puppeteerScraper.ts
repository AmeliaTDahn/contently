import type { ScrapedContent, ScraperResult } from '.';
import * as cheerio from 'cheerio';

/**
 * Helper function to convert relative URLs to absolute URLs
 */
function resolveUrl(baseUrl: string, relativeUrl: string | undefined): string | undefined {
  if (!relativeUrl) return undefined;
  
  try {
    // If it's already an absolute URL, return it as is
    if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
      return relativeUrl;
    }
    
    // If it's a protocol-relative URL (starts with //), add the protocol
    if (relativeUrl.startsWith('//')) {
      const baseUrlObj = new URL(baseUrl);
      return `${baseUrlObj.protocol}${relativeUrl}`;
    }
    
    // Handle anchor links (links that start with #)
    if (relativeUrl.startsWith('#')) {
      return `${baseUrl}${relativeUrl}`;
    }
    
    // Create a URL object from the base URL
    const baseUrlObj = new URL(baseUrl);
    
    // If the relative URL starts with /, it's relative to the root domain
    if (relativeUrl.startsWith('/')) {
      return `${baseUrlObj.origin}${relativeUrl}`;
    }
    
    // Otherwise, it's relative to the current path
    // Remove the filename from the path if it exists
    let basePath = baseUrlObj.pathname;
    if (!basePath.endsWith('/')) {
      basePath = basePath.substring(0, basePath.lastIndexOf('/') + 1);
    }
    
    return `${baseUrlObj.origin}${basePath}${relativeUrl}`;
  } catch (error) {
    console.error('Error resolving URL:', error);
    return relativeUrl; // Return the original URL if there's an error
  }
}

interface ScrapingResult {
  error?: { message: string };
  content?: {
    mainContent: string;
    metadata: {
      title?: string;
      description?: string;
      keywords?: string[] | string;
      author?: string;
    };
  };
}

/**
 * Scraper using cheerio for HTML content
 */
export async function scrapePuppeteer(url: string): Promise<ScrapingResult> {
  try {
    console.log('Fetching URL:', url);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $('script, style, iframe, nav, header, footer, form, .cookie-banner, .advertisement, .social-share, #comments').remove();

    // Extract metadata
    console.log('Extracting metadata...');
    const metadata = {
      title: $('title').text().trim(),
      description: $('meta[name="description"]').attr('content') || 
                  $('meta[property="og:description"]').attr('content'),
      keywords: $('meta[name="keywords"]').attr('content'),
      author: $('meta[name="author"]').attr('content') ||
              $('meta[property="article:author"]').attr('content')
    };

    // Extract main content
    console.log('Extracting main content...');
    let mainContent = '';

    // Try to find the main content using common selectors
    const selectors = [
      'article',
      'main',
      '[role="main"]',
      '.post-content',
      '.article-content',
      '.entry-content',
      '.content',
      '#content'
    ];

    for (const selector of selectors) {
      const element = $(selector);
      if (element.length > 0) {
        mainContent = element.text().trim();
        if (mainContent.length > 100) {
          break;
        }
      }
    }

    // Fallback to body content if no main content found
    if (!mainContent || mainContent.length < 100) {
      mainContent = $('body').text().trim();
    }

    // Clean up the content
    mainContent = mainContent
      .replace(/[\t\r\n]+/g, '\n') // Replace multiple whitespace with single newline
      .replace(/\n\s+/g, '\n') // Remove leading spaces after newlines
      .replace(/\n+/g, '\n\n') // Replace multiple newlines with double newlines
      .trim();

    if (!mainContent || mainContent.length < 100) {
      throw new Error('Failed to extract meaningful content from the page');
    }

    console.log('Successfully extracted content');
    return {
      content: {
        mainContent,
        metadata
      }
    };

  } catch (error) {
    console.error('Error in cheerio scraper:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Unknown error occurred while scraping'
      }
    };
  }
} 