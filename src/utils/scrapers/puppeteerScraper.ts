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
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-site-isolation-trials',
        '--no-zygote',
        '--single-process',
        '--no-first-run'
      ]
    });

    const page = await browser.newPage();
    
    // Set longer timeouts
    await page.setDefaultNavigationTimeout(60000); // 60 seconds
    await page.setDefaultTimeout(60000);

    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Block unnecessary resources to speed up loading
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      if (['image', 'stylesheet', 'font', 'media', 'other'].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // Add error handling for page errors
    page.on('error', err => {
      console.error('Page error:', err);
    });

    page.on('pageerror', err => {
      console.error('Page error:', err);
    });

    // Navigate to the page with retry logic
    let response;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        response = await page.goto(url, {
          waitUntil: ['networkidle0', 'domcontentloaded'],
          timeout: 60000
        });
        if (response && response.ok()) break;
      } catch (err) {
        console.error(`Navigation attempt ${attempt + 1} failed:`, err);
        if (attempt === 2) throw err;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    if (!response) {
      throw new Error('Failed to get response from page');
    }

    const status = response.status();
    if (status !== 200) {
      throw new Error(`Page returned status code ${status}`);
    }

    // Wait for content to be available
    await page.waitForFunction(() => document.body.innerHTML.length > 0);

    // Extract metadata and content
    const metadata = await Promise.race([
      page.evaluate(() => ({
        title: document.title || '',
        description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
        keywords: document.querySelector('meta[name="keywords"]')?.getAttribute('content')?.split(',').map(k => k.trim()) || [],
        author: document.querySelector('meta[name="author"]')?.getAttribute('content') || '',
        ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute('content') || ''
      })),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Metadata extraction timed out')), 10000))
    ]) as ScrapedContent['metadata'];

    // Extract main content and other required fields
    interface ExtractedContent {
      headings: { h1Tags: string[]; headings: string[] };
      links: Array<{ text: string; href: string; originalHref: string }>;
      images: Array<{ src: string; alt: string }>;
      tables: Array<{ headers: string[]; rows: string[][] }>;
      structuredData: Record<string, unknown>[];
      mainContent: string;
    }

    const content = await Promise.race([
      page.evaluate(() => {
        // Remove script tags, style tags, and comments
        const scripts = document.getElementsByTagName('script');
        const styles = document.getElementsByTagName('style');
        Array.from(scripts).forEach(script => script.remove());
        Array.from(styles).forEach(style => style.remove());

        // Get headings
        const h1Tags = Array.from(document.querySelectorAll('h1')).map(h => h.textContent || '');
        const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).map(h => h.textContent || '');

        // Get links
        const links = Array.from(document.querySelectorAll('a')).map(a => ({
          text: a.textContent || '',
          href: a.href || '',
          originalHref: a.getAttribute('href') || ''
        }));

        // Get images
        const images = Array.from(document.querySelectorAll('img')).map(img => ({
          src: img.src || '',
          alt: img.alt || ''
        }));

        // Get tables
        const tables = Array.from(document.querySelectorAll('table')).map(table => ({
          headers: Array.from(table.querySelectorAll('th')).map(th => th.textContent || ''),
          rows: Array.from(table.querySelectorAll('tr')).map(tr => 
            Array.from(tr.querySelectorAll('td')).map(td => td.textContent || '')
          )
        }));

        // Get structured data
        const structuredData = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
          .map(script => {
            try {
              return JSON.parse(script.textContent || '{}');
            } catch {
              return {};
            }
          });

        // Get main content
        const article = document.querySelector('article');
        const main = document.querySelector('main');
        const contentDiv = document.querySelector('.content');
        let mainContent = '';
        
        if (article) {
          mainContent = article.textContent || '';
        } else if (main) {
          mainContent = main.textContent || '';
        } else if (contentDiv) {
          mainContent = contentDiv.textContent || '';
        } else {
          mainContent = document.body.textContent || '';
        }

        return {
          headings: { h1Tags, headings },
          links,
          images,
          tables,
          structuredData,
          mainContent: mainContent.trim()
        };
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Content extraction timed out')), 15000))
    ]) as ExtractedContent;

    if (!content.mainContent || content.mainContent.length < 100) {
      throw new Error('Failed to extract meaningful content from the page');
    }

    const scrapedContent: ScrapedContent = {
      metadata,
      headings: content.headings,
      links: content.links,
      images: content.images,
      tables: content.tables,
      structuredData: content.structuredData,
      mainContent: content.mainContent
    };

    return { content: scrapedContent };

  } catch (error) {
    console.error('Error in Puppeteer scraper:', error);
    const scraperError: ScraperError = {
      name: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? error.message : 'Unknown error occurred while scraping',
      stack: error instanceof Error ? error.stack : undefined
    };
    return { error: scraperError };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
} 