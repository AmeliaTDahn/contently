import { type NextRequest } from 'next/server';
import { scrapeServerless } from '@/utils/scrapers/serverlessScraper';

interface CalendarEvent {
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
}

interface RequestBody {
  url: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as RequestBody;
    
    if (!body.url || typeof body.url !== 'string') {
      return new Response(
        JSON.stringify({
          error: {
            name: 'ValidationError',
            message: 'URL is required and must be a string'
          }
        }),
        { status: 400 }
      );
    }

    // First, scrape the content
    const result = await scrapeServerless(body.url);
    
    if (result.error) {
      return new Response(JSON.stringify(result), { status: 500 });
    }

    if (!result.content) {
      return new Response(
        JSON.stringify({
          error: {
            name: 'ScrapingError',
            message: 'Failed to extract content from URL'
          }
        }),
        { status: 500 }
      );
    }

    // Extract dates and events from the content
    const events: CalendarEvent[] = extractEventsFromContent(result.content.mainContent);

    return new Response(JSON.stringify({ events }));
  } catch (e) {
    console.error('Error in generate-calendar API:', e);
    return new Response(
      JSON.stringify({
        error: {
          name: e instanceof Error ? e.name : 'UnknownError',
          message: e instanceof Error ? e.message : 'An unknown error occurred',
          stack: e instanceof Error ? e.stack : undefined
        }
      }),
      { status: 500 }
    );
  }
}

function extractEventsFromContent(content: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  
  // Extract dates with various formats
  extractDatesWithFormat(content, events);
  
  // Extract dates with month names
  extractDatesWithMonthNames(content, events);
  
  // Extract dates with day of week
  extractDatesWithDayOfWeek(content, events);
  
  // Extract date ranges
  extractDateRanges(content, events);
  
  return events;
}

function extractDatesWithFormat(content: string, events: CalendarEvent[]): void {
  // Match MM/DD/YYYY, MM-DD-YYYY, YYYY/MM/DD, YYYY-MM-DD
  const datePatterns = [
    // MM/DD/YYYY or MM-DD-YYYY
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/g,
    // YYYY/MM/DD or YYYY-MM-DD
    /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/g
  ];
  
  for (const pattern of datePatterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content)) !== null) {
      // Ensure all capture groups exist
      if (!match[1] || !match[2] || !match[3]) continue;

      const contextStart = Math.max(0, match.index - 100);
      const contextEnd = Math.min(content.length, match.index + 100);
      const context = content.substring(contextStart, contextEnd);
      
      if (pattern === datePatterns[0]) {
        // MM/DD/YYYY format
        const month = parseInt(match[1], 10);
        const day = parseInt(match[2], 10);
        const year = parseInt(match[3], 10);
        
        if (isValidDate(year, month, day)) {
          const date = new Date(year, month - 1, day);
          addEventFromDate(date, context, events);
        }
      } else {
        // YYYY/MM/DD format
        const year = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        const day = parseInt(match[3], 10);
        
        if (isValidDate(year, month, day)) {
          const date = new Date(year, month - 1, day);
          addEventFromDate(date, context, events);
        }
      }
    }
  }
}

function extractDatesWithMonthNames(content: string, events: CalendarEvent[]): void {
  // Match "Month Day, Year" format (e.g., "January 1, 2023")
  const monthPattern = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/gi;
  
  // Map of month names to their numeric values
  const monthMap: Record<string, number> = {
    'january': 0, 'february': 1, 'march': 2, 'april': 3, 'may': 4, 'june': 5,
    'july': 6, 'august': 7, 'september': 8, 'october': 9, 'november': 10, 'december': 11
  };
  
  let match: RegExpExecArray | null;
  while ((match = monthPattern.exec(content)) !== null) {
    if (match[1] && match[2] && match[3]) {
      const monthName = match[1].toLowerCase();
      const day = parseInt(match[2], 10);
      const year = parseInt(match[3], 10);
      
      if (monthMap[monthName] !== undefined && day >= 1 && day <= 31 && year >= 1900 && year <= 2100) {
        const date = new Date(year, monthMap[monthName], day);
        
        const contextStart = Math.max(0, match.index - 100);
        const contextEnd = Math.min(content.length, match.index + 100);
        const context = content.substring(contextStart, contextEnd);
        
        addEventFromDate(date, context, events);
      }
    }
  }
}

function extractDatesWithDayOfWeek(content: string, events: CalendarEvent[]): void {
  // Match "Day of Week, Month Day" format (e.g., "Monday, January 1")
  const dayOfWeekPattern = /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?\b/gi;
  
  // Map of month names to their numeric values
  const monthMap: Record<string, number> = {
    'january': 0, 'february': 1, 'march': 2, 'april': 3, 'may': 4, 'june': 5,
    'july': 6, 'august': 7, 'september': 8, 'october': 9, 'november': 10, 'december': 11
  };
  
  const currentYear = new Date().getFullYear();
  
  let match: RegExpExecArray | null;
  while ((match = dayOfWeekPattern.exec(content)) !== null) {
    if (match[1] && match[2] && match[3]) {
      const monthName = match[2].toLowerCase();
      const day = parseInt(match[3], 10);
      
      if (monthMap[monthName] !== undefined && day >= 1 && day <= 31) {
        // Assume current year if not specified
        const date = new Date(currentYear, monthMap[monthName], day);
        
        const contextStart = Math.max(0, match.index - 100);
        const contextEnd = Math.min(content.length, match.index + 100);
        const context = content.substring(contextStart, contextEnd);
        
        addEventFromDate(date, context, events);
      }
    }
  }
}

function extractDateRanges(content: string, events: CalendarEvent[]): void {
  // Match date ranges like "January 1-3, 2023" or "January 1 - January 3, 2023"
  const dateRangePattern = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?\s*[-–—]\s*(?:(?:(January|February|March|April|May|June|July|August|September|October|November|December)\s+)?(\d{1,2})(?:st|nd|rd|th)?)?,?\s+(\d{4})\b/gi;
  
  // Map of month names to their numeric values
  const monthMap: Record<string, number> = {
    'january': 0, 'february': 1, 'march': 2, 'april': 3, 'may': 4, 'june': 5,
    'july': 6, 'august': 7, 'september': 8, 'october': 9, 'november': 10, 'december': 11
  };
  
  let match: RegExpExecArray | null;
  while ((match = dateRangePattern.exec(content)) !== null) {
    if (match[1] && match[2] && match[4] && match[5]) {
      const startMonthName = match[1].toLowerCase();
      const startDay = parseInt(match[2], 10);
      // If end month is not specified, use the start month
      const endMonthName = (match[3] ? match[3].toLowerCase() : startMonthName);
      const endDay = parseInt(match[4], 10);
      const year = parseInt(match[5], 10);
      
      if (monthMap[startMonthName] !== undefined && startDay >= 1 && startDay <= 31 &&
          monthMap[endMonthName] !== undefined && endDay >= 1 && endDay <= 31 &&
          year >= 1900 && year <= 2100) {
        
        const startDate = new Date(year, monthMap[startMonthName], startDay);
        const endDate = new Date(year, monthMap[endMonthName], endDay);
        endDate.setHours(23, 59, 59); // Set to end of day
        
        const contextStart = Math.max(0, match.index - 100);
        const contextEnd = Math.min(content.length, match.index + 100);
        const context = content.substring(contextStart, contextEnd);
        
        // Extract event title from context
        const matchText = match[0] || '';
        const title = extractEventTitle(context, matchText) || `Event from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`;
        
        events.push({
          title,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          description: context.trim()
        });
      }
    }
  }
}

function isValidDate(year: number, month: number, day: number): boolean {
  return year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31;
}

function addEventFromDate(date: Date, context: string, events: CalendarEvent[]): void {
  if (!isNaN(date.getTime())) {
    // Extract event title from context
    const dateStr = date.toLocaleDateString();
    const title = extractEventTitle(context, dateStr) || `Event on ${dateStr}`;
    
    // Create end date (24 hours later)
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59); // Set to end of day
    
    events.push({
      title,
      start: date.toISOString(),
      end: endDate.toISOString(),
      description: context.trim()
    });
  }
}

function extractEventTitle(context: string, dateStr: string): string | null {
  // Look for event keywords near the date
  const eventKeywords = ['event', 'meeting', 'conference', 'webinar', 'workshop', 'seminar', 'deadline', 'due date', 'appointment'];
  
  // Remove the date string from the context to avoid including it in the title
  const contextWithoutDate = context.replace(dateStr, '');
  
  // Look for sentences containing event keywords
  for (const keyword of eventKeywords) {
    const keywordIndex = contextWithoutDate.toLowerCase().indexOf(keyword);
    if (keywordIndex !== -1) {
      // Extract the sentence containing the keyword
      const sentenceStart = contextWithoutDate.lastIndexOf('.', keywordIndex) + 1;
      const sentenceEnd = contextWithoutDate.indexOf('.', keywordIndex);
      if (sentenceEnd !== -1) {
        const sentence = contextWithoutDate.substring(sentenceStart, sentenceEnd).trim();
        if (sentence.length > 0 && sentence.length < 100) {
          return sentence;
        }
      }
    }
  }
  
  // If no event keyword found, look for capitalized phrases
  const capitalizedPhrasePattern = /\b[A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
  const capitalizedPhrases = contextWithoutDate.match(capitalizedPhrasePattern);
  if (capitalizedPhrases && capitalizedPhrases.length > 0) {
    // Find the closest capitalized phrase to the middle of the context
    const middleIndex = contextWithoutDate.length / 2;
    // Use type assertion to tell TypeScript that we know this is a string
    const firstPhrase = capitalizedPhrases[0] as string;
    let closestPhrase = firstPhrase;
    let closestDistance = Math.abs(contextWithoutDate.indexOf(closestPhrase) - middleIndex);
    
    for (let i = 1; i < capitalizedPhrases.length; i++) {
      // Use type assertion to tell TypeScript that we know this is a string
      const phrase = capitalizedPhrases[i] as string;
      const distance = Math.abs(contextWithoutDate.indexOf(phrase) - middleIndex);
      if (distance < closestDistance) {
        closestPhrase = phrase;
        closestDistance = distance;
      }
    }
    
    return closestPhrase;
  }
  
  return null;
} 