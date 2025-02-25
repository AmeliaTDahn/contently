import axios, { AxiosError } from 'axios';
import * as cheerio from 'cheerio';

/**
 * Basic scraper using Cheerio for static HTML content
 */
export async function scrapeWithCheerio(url: string) {
  try {
    console.log(`Scraping ${url} with Cheerio...`);
    
    // Fetch the HTML content
    console.log('Fetching HTML content...');
    const { data } = await axios.get(url, {
      timeout: 30000, // 30 second timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });
    console.log(`Received ${typeof data === 'string' ? data.length : 'unknown'} bytes of data`);
    
    // Load the HTML into Cheerio
    console.log('Parsing HTML with Cheerio...');
    const $ = cheerio.load(data);
    
    // Extract basic information
    console.log('Extracting page information...');
    
    // Get title
    const title = $('title').text();
    console.log(`Title: ${title}`);
    
    // Get description
    const description = $('meta[name="description"]').attr('content') || '';
    
    // Get h1 tags
    const h1Tags = $('h1').map((_, el) => $(el).text().trim()).get();
    console.log(`Found ${h1Tags.length} h1 tags`);
    
    // Get links
    const links = $('a').map((_, el) => ({
      text: $(el).text().trim(),
      href: $(el).attr('href'),
    })).get();
    console.log(`Found ${links.length} links`);
    
    // Get images
    const images = $('img').map((_, el) => ({
      alt: $(el).attr('alt'),
      src: $(el).attr('src'),
    })).get();
    console.log(`Found ${images.length} images`);
    
    // Get main content
    const mainContent = $('#main-content, .main-content, main, article').text().trim() || $('body').text().trim();
    console.log(`Extracted ${mainContent.length} characters of main content`);
    
    // Compile results
    const result = {
      title,
      description,
      h1Tags,
      links,
      images,
      mainContent,
    };
    
    console.log('Cheerio scraping completed successfully');
    return {
      success: true,
      data: result,
      message: 'Scraping completed successfully with Cheerio',
    };
  } catch (error) {
    console.error('Error scraping with Cheerio:', error);
    
    // Provide more detailed error information
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    };
    
    // Check for specific error types
    let errorMessage = 'Unknown error occurred';
    
    if (error instanceof Error) {
      // Check if it's an Axios error
      const axiosError = error as AxiosError;
      if (axios.isAxiosError(axiosError)) {
        if (axiosError.code === 'ECONNREFUSED') {
          errorMessage = 'Connection refused. The website may be down or blocking requests.';
        } else if (axiosError.code === 'ETIMEDOUT') {
          errorMessage = 'Connection timed out. The website took too long to respond.';
        } else if (axiosError.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          errorMessage = `Server responded with status code ${axiosError.response.status}`;
        } else if (axiosError.request) {
          // The request was made but no response was received
          errorMessage = 'No response received from the server';
        }
      } else {
        // Regular Error
        errorMessage = error.message;
      }
    }
    
    return {
      success: false,
      data: null,
      message: `Error: ${errorMessage}`,
      errorDetails
    };
  }
} 