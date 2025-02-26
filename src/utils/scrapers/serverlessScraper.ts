import type { ScrapedContent, ScraperResult } from '.';
import { JSDOM } from 'jsdom';

/**
 * A serverless-friendly scraper that uses fetch instead of Puppeteer
 */
export async function scrapeServerless(url: string): Promise<ScraperResult> {
  try {
    // Validate URL
    const validUrl = new URL(url);
    
    // Fetch the HTML content
    const response = await fetch(validUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    
    // Parse HTML using jsdom
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    
    // Extract metadata
    const title = doc.querySelector('title')?.textContent || '';
    const metaDescription = doc.querySelector('meta[name="description"]')?.getAttribute('content') || 
                           doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';
    const metaKeywords = doc.querySelector('meta[name="keywords"]')?.getAttribute('content') || '';
    const keywords = metaKeywords.split(',').map(k => k.trim());
    const author = doc.querySelector('meta[name="author"]')?.getAttribute('content') || '';
    const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';
    
    // Extract headings
    const h1Tags = Array.from(doc.querySelectorAll('h1')).map(h => h.textContent?.trim() || '');
    const headings = Array.from(doc.querySelectorAll('h1, h2, h3')).map(h => h.textContent?.trim() || '');
    
    // Extract links
    const links = Array.from(doc.querySelectorAll('a')).map(a => ({
      text: a.textContent?.trim() || '',
      href: a.getAttribute('href') || '',
      originalHref: a.getAttribute('href') || '',
    }));
    
    // Extract images
    const images = Array.from(doc.querySelectorAll('img')).map(img => ({
      src: img.getAttribute('src') || '',
      alt: img.getAttribute('alt') || '',
    }));
    
    // Extract tables
    const tables = Array.from(doc.querySelectorAll('table')).map(table => {
      const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent?.trim() || '');
      const rows = Array.from(table.querySelectorAll('tr')).map(tr =>
        Array.from(tr.querySelectorAll('td')).map(td => td.textContent?.trim() || '')
      );
      return { headers, rows };
    });
    
    // Extract structured data
    const structuredData: Record<string, unknown>[] = [];
    doc.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
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
    const mainContent = doc.body.textContent?.trim() || '';
    
    return {
      content: {
        metadata: {
          title,
          description: metaDescription,
          keywords,
          author,
          ogImage,
        },
        headings: {
          h1Tags,
          headings,
        },
        links,
        images,
        tables,
        structuredData,
        mainContent,
        // No screenshot in serverless mode
      }
    };
  } catch (e) {
    console.error('Error in serverless scraper:', e);
    return {
      error: {
        name: e instanceof Error ? e.name : 'UnknownError',
        message: e instanceof Error ? e.message : 'An unknown error occurred',
        stack: e instanceof Error ? e.stack : undefined
      }
    };
  }
} 