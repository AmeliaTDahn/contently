import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

/**
 * Advanced scraper using Puppeteer for JavaScript-rendered content
 */
export async function scrapeWithPuppeteer(url: string) {
  let browser = null;
  
  try {
    console.log(`Scraping ${url} with Puppeteer...`);
    
    // Launch a headless browser with more detailed logging
    console.log('Launching Puppeteer browser...');
    browser = await puppeteer.launch({
      headless: true, // Use headless mode
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // Overcome limited resource problems
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1280,800',
      ],
    });
    console.log('Puppeteer browser launched successfully');
    
    // Open a new page
    console.log('Opening new page...');
    const page = await browser.newPage();
    
    // Set viewport size
    await page.setViewport({ width: 1280, height: 800 });
    
    // Set user agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
    
    // Set longer timeout for navigation
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 60000 // Increase timeout to 60 seconds
    });
    console.log('Page loaded successfully');
    
    // Wait for content to load (adjust selectors as needed)
    console.log('Waiting for body element...');
    await page.waitForSelector('body', { timeout: 30000 });
    console.log('Body element found');
    
    // Extract metadata
    console.log('Extracting metadata...');
    const metadata = await page.evaluate(() => {
      return {
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
        ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '',
        ogDescription: document.querySelector('meta[property="og:description"]')?.getAttribute('content') || '',
        ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute('content') || '',
        canonicalUrl: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '',
      };
    });
    console.log('Metadata extracted:', metadata.title);
    
    // Get the fully rendered HTML (including JavaScript-loaded content)
    console.log('Getting page content...');
    const content = await page.content();
    console.log(`Page content retrieved (${content.length} bytes)`);
    
    // Use Cheerio to parse the fully rendered HTML
    console.log('Parsing content with Cheerio...');
    const $ = cheerio.load(content);
    
    // Extract structured data (JSON-LD)
    console.log('Extracting structured data...');
    const structuredData = await page.evaluate(() => {
      const elements = document.querySelectorAll('script[type="application/ld+json"]');
      return Array.from(elements).map(el => {
        try {
          return JSON.parse(el.textContent || '{}');
        } catch (e) {
          return {};
        }
      });
    });
    console.log(`Found ${structuredData.length} structured data items`);
    
    // Take a screenshot with error handling
    console.log('Taking screenshot...');
    let screenshot;
    try {
      screenshot = await page.screenshot({ 
        encoding: 'base64',
        fullPage: false, // Only capture viewport to reduce memory usage
        type: 'jpeg',    // Use JPEG for smaller file size
        quality: 80      // Reduce quality for smaller file size
      });
      console.log('Screenshot taken successfully');
    } catch (screenshotError) {
      console.error('Error taking screenshot:', screenshotError);
      screenshot = null;
    }
    
    // Extract text content from main elements
    console.log('Extracting main content...');
    const mainContent = $('#main-content, .main-content, main, article').text().trim() || $('body').text().trim();
    
    // Extract all links
    console.log('Extracting links...');
    const links = $('a').map((_, el) => ({
      text: $(el).text().trim(),
      href: $(el).attr('href'),
    })).get();
    console.log(`Found ${links.length} links`);
    
    // Extract all images
    console.log('Extracting images...');
    const images = $('img').map((_, el) => ({
      alt: $(el).attr('alt'),
      src: $(el).attr('src'),
      width: $(el).attr('width'),
      height: $(el).attr('height'),
    })).get();
    console.log(`Found ${images.length} images`);
    
    // Extract headings
    console.log('Extracting headings...');
    const headings = {
      h1: $('h1').map((_, el) => $(el).text().trim()).get(),
      h2: $('h2').map((_, el) => $(el).text().trim()).get(),
      h3: $('h3').map((_, el) => $(el).text().trim()).get(),
    };
    console.log(`Found ${headings.h1.length} h1, ${headings.h2.length} h2, and ${headings.h3.length} h3 tags`);
    
    // Extract tables if present
    console.log('Extracting tables...');
    const tables = $('table').map((i, table) => {
      const headers = $(table).find('th').map((_, th) => $(th).text().trim()).get();
      const rows = $(table).find('tr').map((_, tr) => {
        return $(tr).find('td').map((_, td) => $(td).text().trim()).get();
      }).get();
      return { tableIndex: i, headers, rows };
    }).get();
    console.log(`Found ${tables.length} tables`);
    
    // Extract forms
    console.log('Extracting forms...');
    const forms = $('form').map((i, form) => {
      const action = $(form).attr('action');
      const method = $(form).attr('method');
      const inputs = $(form).find('input').map((_, input) => {
        return {
          name: $(input).attr('name'),
          type: $(input).attr('type'),
          id: $(input).attr('id'),
          placeholder: $(input).attr('placeholder'),
        };
      }).get();
      return { formIndex: i, action, method, inputs };
    }).get();
    console.log(`Found ${forms.length} forms`);
    
    // Compile all data
    console.log('Compiling results...');
    const result = {
      url,
      metadata,
      structuredData,
      headings,
      links,
      images,
      tables,
      forms,
      mainContent,
      screenshot: screenshot ? `data:image/jpeg;base64,${screenshot}` : null,
    };
    
    console.log('Scraping completed successfully');
    return {
      success: true,
      data: result,
      message: 'Scraping completed successfully with Puppeteer',
    };
  } catch (error) {
    console.error('Error scraping with Puppeteer:', error);
    // Provide more detailed error information
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    };
    
    return {
      success: false,
      data: null,
      message: `Error: ${errorDetails.message}`,
      errorDetails
    };
  } finally {
    // Always close the browser
    if (browser) {
      console.log('Closing Puppeteer browser...');
      try {
        await browser.close();
        console.log('Browser closed successfully');
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
  }
} 