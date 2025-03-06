import type { ScrapedContent, ScraperResult, ScraperError } from '.';
import puppeteer from 'puppeteer';

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
 * Advanced scraper using Puppeteer for JavaScript-rendered content
 */
export async function scrapePuppeteer(url: string): Promise<ScraperResult> {
  let browser;
  try {
    // Use minimal browser configuration
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });

    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(60000);

    // Navigate to the page
    await page.goto(url, { waitUntil: 'networkidle0' });

    // Extract content using a simpler approach
    const content = await page.evaluate(() => {
      const getMetadata = () => ({
        title: document.title || '',
        description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
        keywords: document.querySelector('meta[name="keywords"]')?.getAttribute('content')?.split(',').map(k => k.trim()) || [],
        author: document.querySelector('meta[name="author"]')?.getAttribute('content') || '',
        ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute('content') || ''
      });

      const getMainContent = () => {
        // Try to get content from common selectors
        const selectors = ['article', 'main', '.content', '.article', '.post'];
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element?.textContent) {
            return element.textContent.trim();
          }
        }

        // Fallback to getting the largest text block
        const textBlocks = Array.from(document.querySelectorAll('p, div, section'))
          .map(el => el.textContent || '')
          .filter(text => text.length > 100)
          .sort((a, b) => b.length - a.length);

        return textBlocks[0] || document.body?.textContent?.trim() || '';
      };

      const getHeadings = () => ({
        h1Tags: Array.from(document.querySelectorAll('h1')).map(h => h.textContent || ''),
        headings: Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).map(h => h.textContent || '')
      });

      const getLinks = () => Array.from(document.querySelectorAll('a')).map(a => ({
        text: a.textContent || '',
        href: a.href || '',
        originalHref: a.getAttribute('href') || ''
      }));

      const getImages = () => Array.from(document.querySelectorAll('img')).map(img => ({
        src: img.src || '',
        alt: img.alt || ''
      }));

      const getTables = () => Array.from(document.querySelectorAll('table')).map(table => ({
        headers: Array.from(table.querySelectorAll('th')).map(th => th.textContent || ''),
        rows: Array.from(table.querySelectorAll('tr')).map(tr => 
          Array.from(tr.querySelectorAll('td')).map(td => td.textContent || '')
        )
      }));

      const getStructuredData = () => {
        try {
          return Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
            .map(script => JSON.parse(script.textContent || '{}'));
        } catch {
          return [];
        }
      };

      return {
        metadata: getMetadata(),
        headings: getHeadings(),
        links: getLinks(),
        images: getImages(),
        tables: getTables(),
        structuredData: getStructuredData(),
        mainContent: getMainContent()
      };
    });

    if (!content.mainContent || content.mainContent.length < 100) {
      throw new Error('Failed to extract meaningful content from the page');
    }

    return { content: content as ScrapedContent };

  } catch (error) {
    console.error('Error in Puppeteer scraper:', error);
    return {
      error: {
        name: error instanceof Error ? error.name : 'UnknownError',
        message: error instanceof Error ? error.message : 'Unknown error occurred while scraping',
        stack: error instanceof Error ? error.stack : undefined
      }
    };
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (error) {
        console.error('Error closing browser:', error);
      }
    }
  }
} 