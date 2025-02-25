import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface ScrapedImage {
  url: string;
  alt: string;
}

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json().catch((error: Error) => {
      console.error("Error parsing request body:", error);
      return {};
    });
    
    const { url } = body;

    // Validate URL
    if (!url || typeof url !== 'string') {
      console.error("Invalid URL provided:", url);
      return NextResponse.json({ error: 'Valid URL is required' }, { status: 400 });
    }

    // Validate URL format
    let urlObj;
    try {
      urlObj = new URL(url);
    } catch (e) {
      console.error("Invalid URL format:", url, e);
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    console.log("Attempting to fetch URL:", url);
    
    // Fetch the URL content with a timeout
    let response;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        redirect: 'follow', // Follow redirects
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
    } catch (error: any) {
      console.error("Fetch error:", error);
      return NextResponse.json({ 
        error: `Failed to fetch URL: ${error?.message || 'Unknown error'}` 
      }, { status: 500 });
    }

    // Check if the fetch was successful
    if (!response.ok) {
      console.error("Response not OK:", response.status, response.statusText);
      
      // Special handling for 404 errors
      if (response.status === 404) {
        return NextResponse.json({ 
          error: `The page was not found (404). Please check if the URL is correct and accessible.` 
        }, { status: 404 });
      }
      
      // Handle other status codes
      return NextResponse.json({ 
        error: `Failed to fetch URL: ${response.status} ${response.statusText}` 
      }, { status: response.status });
    }

    // Get the content type to ensure we're dealing with HTML
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
      console.error("Not HTML content:", contentType);
      return NextResponse.json({ 
        error: `URL does not contain HTML content (${contentType}). Only HTML pages can be scraped.` 
      }, { status: 415 });
    }

    // Get the HTML content
    let html;
    try {
      html = await response.text();
      if (!html || html.trim().length === 0) {
        console.error("Empty HTML response");
        return NextResponse.json({ error: 'Empty response from URL' }, { status: 500 });
      }
    } catch (error: any) {
      console.error("Error reading response:", error);
      return NextResponse.json({ 
        error: `Failed to read response: ${error?.message || 'Unknown error'}` 
      }, { status: 500 });
    }
    
    console.log("Successfully fetched HTML, length:", html.length);
    
    // Parse with cheerio
    let $;
    try {
      $ = cheerio.load(html);
    } catch (error: any) {
      console.error("Cheerio parsing error:", error);
      return NextResponse.json({ 
        error: `Failed to parse HTML: ${error?.message || 'Unknown error'}` 
      }, { status: 500 });
    }
    
    // Extract content
    const title = $('title').text().trim() || 'No title found';
    const description = $('meta[name="description"]').attr('content') || 
                       $('meta[property="og:description"]').attr('content') || 
                       'No description found';
    
    // Extract main content
    let content = '';
    const contentSelectors = ['article', '.post-content', '.entry-content', '.content', '#content', 'main', '.article-content', '.post', '.blog-post'];
    
    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text().replace(/\s+/g, ' ').trim();
        if (content.length > 100) break;
      }
    }
    
    // Fallback to body if no content found
    if (!content || content.length < 100) {
      content = $('body').text().replace(/\s+/g, ' ').trim();
      if (content.length > 2000) {
        content = content.substring(0, 2000) + '...';
      }
    }
    
    if (!content || content.length === 0) {
      content = 'No content found';
    }
    
    // Extract publish date
    let publishDate = null;
    const dateSelectors = [
      'meta[property="article:published_time"]',
      'meta[name="date"]',
      'meta[name="pubdate"]',
      'meta[property="og:published_time"]',
      'time',
      '.published-date',
      '.post-date',
      '.date',
      '.time'
    ];
    
    for (const selector of dateSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        const dateStr = element.attr('content') || element.attr('datetime') || element.text();
        if (dateStr) {
          try {
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
              publishDate = date.toISOString();
              break;
            }
          } catch (e) {
            // Continue if date parsing fails
          }
        }
      }
    }
    
    // Extract images
    const images: ScrapedImage[] = [];
    try {
      $('img').each((_, element) => {
        let imageUrl = $(element).attr('src') || '';
        const imageAlt = $(element).attr('alt') || '';
        
        if (!imageUrl || imageUrl.startsWith('data:')) return;
        
        // Handle relative URLs
        if (imageUrl.startsWith('/')) {
          imageUrl = `${urlObj.origin}${imageUrl}`;
        } else if (!imageUrl.startsWith('http')) {
          try {
            imageUrl = new URL(imageUrl, url).href;
          } catch (e) {
            return;
          }
        }
        
        images.push({ url: imageUrl, alt: imageAlt });
      });
    } catch (error) {
      console.error("Error extracting images:", error);
      // Continue without images if there's an error
    }
    
    // Extract metadata
    const metadata: Record<string, string> = {};
    try {
      $('meta').each((_, element) => {
        const name = $(element).attr('name') || $(element).attr('property');
        const content = $(element).attr('content');
        if (name && content) {
          metadata[name] = content;
        }
      });
    } catch (error) {
      console.error("Error extracting metadata:", error);
      // Continue without metadata if there's an error
    }
    
    console.log("Successfully scraped content from:", url);
    
    // Return the scraped content
    return NextResponse.json({
      url,
      title,
      description,
      publishDate,
      content,
      images: images.slice(0, 10),
      metadata
    });
    
  } catch (error: any) {
    // Handle any unexpected errors
    console.error("Unexpected error in scrape-url API:", error);
    return NextResponse.json({ 
      error: `An unexpected error occurred: ${error?.message || 'Unknown error'}` 
    }, { status: 500 });
  }
} 