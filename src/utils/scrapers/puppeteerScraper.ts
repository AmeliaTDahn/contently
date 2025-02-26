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

/**
 * Advanced scraper using Puppeteer for JavaScript-rendered content
 */
export async function scrapePuppeteer(url: string): Promise<ScraperResult> {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0' });

    const content = await page.evaluate(() => {
      // Helper function to safely get metadata
      const getMetaContent = (name: string): string => {
        const element = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
        return element?.getAttribute('content') ?? '';
      };

      // Get metadata
      const metadata = {
        title: document.title,
        description: getMetaContent('description') ?? getMetaContent('og:description'),
        keywords: getMetaContent('keywords').split(',').map(k => k.trim()),
        author: getMetaContent('author'),
        ogImage: getMetaContent('og:image')
      };

      // Get headings
      const h1Tags = Array.from(document.querySelectorAll('h1')).map(h => h.textContent?.trim() ?? '');
      const headings = Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent?.trim() ?? '');

      // Get links
      const links = Array.from(document.querySelectorAll('a')).map(a => ({
        text: a.textContent?.trim() ?? '',
        href: a.href,
        originalHref: a.getAttribute('href') ?? ''
      }));

      // Get images
      const images = Array.from(document.querySelectorAll('img')).map(img => ({
        src: img.src,
        alt: img.alt ?? ''
      }));

      // Get tables
      const tables = Array.from(document.querySelectorAll('table')).map(table => {
        const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent?.trim() ?? '');
        const rows = Array.from(table.querySelectorAll('tr')).map(tr =>
          Array.from(tr.querySelectorAll('td')).map(td => td.textContent?.trim() ?? '')
        );
        return { headers, rows };
      });

      // Get structured data
      const structuredData: Record<string, unknown>[] = [];
      document.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
        try {
          if (script.textContent) {
            const data = JSON.parse(script.textContent);
            if (data && typeof data === 'object') {
              structuredData.push(data as Record<string, unknown>);
            }
          }
        } catch {
          // Ignore parsing errors
        }
      });

      // Get main content
      const mainContent = document.body.textContent?.trim() ?? '';

      return {
        metadata,
        headings: { h1Tags, headings },
        links,
        images,
        tables,
        structuredData,
        mainContent
      } as ScrapedContent;
    });

    // Take screenshot
    const screenshot = await page.screenshot({ encoding: 'base64' });
    
    await browser.close();

    return {
      content: {
        ...content,
        screenshot: `data:image/png;base64,${screenshot}`
      }
    };
  } catch (e) {
    return {
      error: {
        name: e instanceof Error ? e.name : 'UnknownError',
        message: e instanceof Error ? e.message : 'An unknown error occurred',
        stack: e instanceof Error ? e.stack : undefined
      }
    };
  }
} 