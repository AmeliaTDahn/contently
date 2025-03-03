import type { ScrapedContent, ScraperResult } from '.';
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
export async function scrapePuppeteer(url: string): Promise<ScrapingResult> {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080',
      ]
    });

    const page = await browser.newPage();
    
    // Set longer timeouts
    await page.setDefaultNavigationTimeout(45000); // 45 seconds
    await page.setDefaultTimeout(45000);

    // Block unnecessary resources to speed up loading
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // Navigate to the page
    const response = await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 45000
    });

    if (!response) {
      throw new Error('Failed to get response from page');
    }

    const status = response.status();
    if (status !== 200) {
      throw new Error(`Page returned status code ${status}`);
    }

    // Extract metadata with timeout
    const metadata = await Promise.race([
      page.evaluate(() => ({
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.getAttribute('content') || undefined,
        keywords: document.querySelector('meta[name="keywords"]')?.getAttribute('content') || undefined,
        author: document.querySelector('meta[name="author"]')?.getAttribute('content') || undefined
      })),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Metadata extraction timed out')), 10000))
    ]) as {
      title?: string;
      description?: string;
      keywords?: string;
      author?: string;
    };

    // Extract main content with timeout
    const mainContent = await Promise.race([
      page.evaluate(() => {
        // Remove script tags, style tags, and comments
        const scripts = document.getElementsByTagName('script');
        const styles = document.getElementsByTagName('style');
        Array.from(scripts).forEach(script => script.remove());
        Array.from(styles).forEach(style => style.remove());

        // Get the article content or main content
        const article = document.querySelector('article');
        const main = document.querySelector('main');
        const content = document.querySelector('.content');
        
        let mainContent = '';
        if (article) {
          mainContent = article.textContent || '';
        } else if (main) {
          mainContent = main.textContent || '';
        } else if (content) {
          mainContent = content.textContent || '';
        } else {
          // Fallback to body content
          mainContent = document.body.textContent || '';
        }

        return mainContent.trim();
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Content extraction timed out')), 15000))
    ]) as string;

    if (!mainContent || mainContent.length < 100) {
      throw new Error('Failed to extract meaningful content from the page');
    }

    return {
      content: {
        mainContent,
        metadata
      }
    };

  } catch (error) {
    console.error('Error in Puppeteer scraper:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Unknown error occurred while scraping'
      }
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
} 