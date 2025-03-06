import type { ScrapedContent, ScraperResult, ScraperError } from '.';
import { chromium } from 'playwright-core';

export async function scrapePlaywright(url: string): Promise<ScraperResult> {
  let browser = null;
  try {
    // Launch browser with minimal configuration
    browser = await chromium.launch({
      headless: true,
      chromiumSandbox: false,
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 },
      javaScriptEnabled: true,
      bypassCSP: true
    });

    const page = await context.newPage();
    page.setDefaultTimeout(30000);

    // Navigate to the page with retry logic
    let response = null;
    let lastError = '';
    
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        response = await page.goto(url, { 
          waitUntil: 'domcontentloaded',
          timeout: 20000
        });
        
        if (response && response.ok()) {
          break;
        } else if (response) {
          lastError = `Status: ${response.status()}`;
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        if (attempt === 2) throw error;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    if (!response || !response.ok()) {
      throw new Error(`Failed to load page: ${lastError}`);
    }

    // Wait for content to be available
    await page.waitForLoadState('domcontentloaded');

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
        const selectors = ['article', 'main', '.content', '.article', '.post', '[role="main"]'];
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element?.textContent) {
            return element.textContent.trim();
          }
        }

        // Fallback to getting the largest text block
        const textBlocks = Array.from(document.querySelectorAll('p, div, section'))
          .map(el => ({
            text: el.textContent?.trim() || '',
            length: el.textContent?.length || 0
          }))
          .filter(({ text, length }) => length > 100 && !/^\s*$/.test(text))
          .sort((a, b) => b.length - a.length);

        // Return the largest text block or fallback to body content
        const largestBlock = textBlocks[0];
        if (largestBlock && largestBlock.text) {
          return largestBlock.text;
        }

        // Final fallback
        return document.body?.textContent?.trim() || '';
      };

      const getHeadings = () => ({
        h1Tags: Array.from(document.querySelectorAll('h1'))
          .map(h => h.textContent?.trim() || '')
          .filter(text => text.length > 0),
        headings: Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6'))
          .map(h => h.textContent?.trim() || '')
          .filter(text => text.length > 0)
      });

      const getLinks = () => Array.from(document.querySelectorAll('a'))
        .map(a => ({
          text: a.textContent?.trim() || '',
          href: a.href || '',
          originalHref: a.getAttribute('href') || ''
        }))
        .filter(link => link.text.length > 0 || link.href.length > 0);

      const getImages = () => Array.from(document.querySelectorAll('img'))
        .map(img => ({
          src: img.src || '',
          alt: img.alt || ''
        }))
        .filter(img => img.src.length > 0);

      const getTables = () => Array.from(document.querySelectorAll('table'))
        .map(table => ({
          headers: Array.from(table.querySelectorAll('th'))
            .map(th => th.textContent?.trim() || '')
            .filter(text => text.length > 0),
          rows: Array.from(table.querySelectorAll('tr'))
            .map(tr => Array.from(tr.querySelectorAll('td'))
              .map(td => td.textContent?.trim() || '')
              .filter(text => text.length > 0)
            )
            .filter(row => row.length > 0)
        }))
        .filter(table => table.headers.length > 0 || table.rows.length > 0);

      const getStructuredData = () => {
        try {
          return Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
            .map(script => {
              try {
                return JSON.parse(script.textContent || '{}');
              } catch {
                return {};
              }
            })
            .filter(data => Object.keys(data).length > 0);
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

    // Validate content
    if (!content.mainContent || content.mainContent.length < 100) {
      throw new Error('Failed to extract meaningful content from the page');
    }

    // Clean up any potential circular references
    const cleanContent = JSON.parse(JSON.stringify(content));
    return { content: cleanContent as ScrapedContent };

  } catch (error) {
    console.error('Error in Playwright scraper:', error);
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