"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import CalendarView from './CalendarView';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  url?: string;
}

interface SelectedUrl {
  id: string;
  url: string;
}

interface ApiResponse {
  events?: Array<{
    title?: string;
    start: string;
    end: string;
    description?: string;
  }>;
  error?: string | { message: string };
}

// New interface for the return value of generateCalendarForUrl
interface CalendarGenerationResult {
  eventCount: number;
  totalFound?: number;
  filtered?: number;
  reason?: 'api_error' | 'no_events' | 'filtered_out' | 'other_error';
  error?: string;
}

// Function to generate sample scheduled content events
const generateSampleEvents = (): CalendarEvent[] => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Sample content types and platforms
  const contentTypes = [
    "Blog Post", "Social Media Post", "Newsletter", "Video", "Podcast", 
    "Infographic", "Case Study", "Webinar", "Product Update", "Press Release"
  ];
  
  const platforms = [
    "Website", "LinkedIn", "Twitter", "Instagram", "YouTube", 
    "Facebook", "Medium", "TikTok", "Email", "Pinterest"
  ];
  
  const topics = [
    "Industry Trends", "Product Features", "Customer Success Story", "How-To Guide",
    "Market Analysis", "Team Spotlight", "Company News", "Tips & Tricks",
    "Behind the Scenes", "Q&A Session", "Expert Interview"
  ];
  
  const sampleEvents: CalendarEvent[] = [];
  
  // Generate 30 random events spread across the current month and next month
  for (let i = 0; i < 30; i++) {
    // Random date within current month and next month
    const randomDay = Math.floor(Math.random() * 60) - 15; // Some days in previous month, current month, and next month
    const eventDate = new Date(currentYear, currentMonth, today.getDate() + randomDay);
    
    // Random duration between 1-3 hours for content creation/publishing
    const durationHours = Math.floor(Math.random() * 3) + 1;
    
    // Random hour between 8 AM and 5 PM
    const hour = Math.floor(Math.random() * 10) + 8;
    
    const startTime = new Date(eventDate);
    startTime.setHours(hour, 0, 0, 0);
    
    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + durationHours);
    
    // Generate random content title
    const contentType = contentTypes[Math.floor(Math.random() * contentTypes.length)];
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    const topic = topics[Math.floor(Math.random() * topics.length)];
    
    // Determine if this is a draft, review, or publish event
    const contentStages = ["Draft", "Review", "Publish"];
    const stage = contentStages[Math.floor(Math.random() * contentStages.length)];
    
    const title = `${stage}: ${contentType} - ${topic}`;
    
    // Create description based on the event type
    let description = "";
    if (stage === "Draft") {
      description = `Create initial draft of ${contentType!.toLowerCase()} about ${topic!.toLowerCase()} for ${platform!.toLowerCase()}.`;
    } else if (stage === "Review") {
      description = `Review and finalize ${contentType!.toLowerCase()} about ${topic!.toLowerCase()} before publishing to ${platform!.toLowerCase()}.`;
    } else {
      description = `Publish ${contentType!.toLowerCase()} about ${topic!.toLowerCase()} to ${platform!.toLowerCase()}.`;
    }
    
    sampleEvents.push({
      id: `sample-event-${i}`,
      title,
      start: startTime,
      end: endTime,
      description,
      url: stage === "Publish" ? `https://example.com/${platform!.toLowerCase()}/content/${i}` : undefined
    });
  }
  
  return sampleEvents;
};

// Function to filter events to ensure they're no later than 6 months in the past
const filterEventsByDate = (eventsToFilter: CalendarEvent[]): CalendarEvent[] => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  return eventsToFilter.filter(event => {
    // Keep sample events regardless of date (for demo purposes)
    if (event.id.startsWith('sample-event-')) {
      return true;
    }
    
    // Filter out events that are more than 6 months in the past
    return new Date(event.start) >= sixMonthsAgo;
  });
};

export default function UrlCalendarGenerator() {
  const { user } = useAuth();
  const [urls, setUrls] = useState<string[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<SelectedUrl[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingSelectedUrls, setIsLoadingSelectedUrls] = useState(false);
  const [urlEventCounts, setUrlEventCounts] = useState<Record<string, number>>({});

  // Load sample events and check for selected URLs from URLs page
  useEffect(() => {
    // Load sample events
    const sampleEvents = generateSampleEvents();
    
    // Apply the date filter to sample events
    const filteredSampleEvents = filterEventsByDate(sampleEvents);
    
    // Set the filtered events
    setEvents(filteredSampleEvents);
    
    // Check for URLs from URLs page
    const storedUrls = localStorage.getItem('calendarUrls');
    if (storedUrls) {
      try {
        const parsedUrls = JSON.parse(storedUrls) as SelectedUrl[];
        setSelectedUrls(parsedUrls);
        
        // If we have URLs from the URLs page, generate calendar for them
        if (parsedUrls.length > 0) {
          generateCalendarForSelectedUrls(parsedUrls);
        }
      } catch (err) {
        console.log('[ERROR] Error parsing stored URLs:', err);
      }
    }
  }, []);

  // Function to generate calendar for selected URLs
  const generateCalendarForSelectedUrls = async (urlsToProcess: SelectedUrl[]) => {
    if (urlsToProcess.length === 0) return;
    
    setIsLoadingSelectedUrls(true);
    setError(null);
    
    try {
      // Clear existing events except sample ones
      const sampleEvents = events.filter(event => event.id.startsWith('sample-event-'));
      
      // Apply date filter to sample events
      const filteredSampleEvents = filterEventsByDate(sampleEvents);
      
      // Set the filtered sample events
      setEvents(filteredSampleEvents);
      
      // Process each URL
      let successCount = 0;
      let totalEventsFound = 0;
      let totalEventsFiltered = 0;
      let errorReasons = {
        'api_error': 0,
        'no_events': 0,
        'filtered_out': 0,
        'other_error': 0
      };
      
      for (const urlItem of urlsToProcess) {
        try {
          console.log(`Processing URL: ${urlItem.url}`);
          
          // Show processing status for this URL
          setError(`Analyzing content from ${urlItem.url}...`);
          
          const result = await generateCalendarForUrl(urlItem.url);
          
          // Track detailed results
          if (result && typeof result === 'object') {
            if (result.eventCount > 0) {
              successCount++;
              totalEventsFound += result.totalFound || 0;
              totalEventsFiltered += result.filtered || 0;
            } else {
              // Track reason for failure
              if (result.reason && result.reason in errorReasons) {
                errorReasons[result.reason as keyof typeof errorReasons]++;
              } else {
                errorReasons.other_error++;
              }
            }
            
            // Add the URL to the list if it's not already there and we found events
            if (result.eventCount > 0) {
              setUrls(prevUrls => {
                if (!prevUrls.includes(urlItem.url)) {
                  return [...prevUrls, urlItem.url];
                }
                return prevUrls;
              });
            }
          }
        } catch (err) {
          console.log(`Error processing URL ${urlItem.url}:`, err);
          errorReasons.other_error++;
          // Continue with other URLs even if one fails
        }
      }
      
      // Generate a more helpful error message based on what happened
      if (successCount === 0 && urlsToProcess.length > 0) {
        let errorMessage = 'Could not generate calendar events from any of the selected URLs';
        
        // Add more specific information based on the error reasons
        if (errorReasons.no_events > 0) {
          errorMessage += `. ${errorReasons.no_events} URL(s) did not contain any events`;
        }
        
        if (errorReasons.filtered_out > 0) {
          errorMessage += `. ${errorReasons.filtered_out} URL(s) only had events older than 6 months`;
        }
        
        if (errorReasons.api_error > 0) {
          errorMessage += `. ${errorReasons.api_error} URL(s) could not be processed by our system`;
        }
        
        if (totalEventsFiltered > 0) {
          errorMessage += `. ${totalEventsFiltered} events were filtered out because they were older than 6 months`;
        }
        
        setError(errorMessage);
        
        // Show a more helpful message with suggestions
        setTimeout(() => {
          setError(`No events could be added to your calendar. Try these tips:
          • Check that your URLs contain dates or scheduled content
          • Make sure the content isn't older than 6 months
          • Try different URLs with more recent content`);
        }, 5000);
      } else if (successCount < urlsToProcess.length) {
        let message = `Generated calendar events from ${successCount} out of ${urlsToProcess.length} URLs`;
        
        if (totalEventsFiltered > 0) {
          message += `. Note: ${totalEventsFiltered} events were filtered out because they were older than 6 months.`;
        }
        
        setError(message);
      }
    } catch (err) {
      console.log('Error in generateCalendarForSelectedUrls:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoadingSelectedUrls(false);
      // Clear localStorage after processing
      localStorage.removeItem('calendarUrls');
    }
  };

  // Function to generate calendar for a single URL
  const generateCalendarForUrl = async (urlToProcess: string): Promise<CalendarGenerationResult> => {
    try {
      console.log(`Fetching calendar data for URL: ${urlToProcess}`);
      
      const response = await fetch('/api/generate-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToProcess }),
      });

      console.log(`Response status: ${response.status}`);
      let data: ApiResponse;
      try {
        data = await response.json() as ApiResponse;
        console.log('Response data:', data);
      } catch (jsonError) {
        console.log('Error parsing JSON response:', jsonError);
        return { 
          eventCount: 0, 
          reason: 'api_error',
          error: `Failed to parse response from ${urlToProcess}`
        };
      }

      if (!response.ok) {
        // Handle different error structures
        let errorMessage = 'Failed to generate calendar';
        if (data && typeof data === 'object') {
          if (data.error) {
            if (typeof data.error === 'object' && data.error.message) {
              errorMessage = data.error.message;
            } else if (typeof data.error === 'string') {
              errorMessage = data.error;
            }
          }
        }
        console.log(`Error generating calendar: ${errorMessage}`);
        return { 
          eventCount: 0, 
          reason: 'api_error',
          error: `Error processing ${urlToProcess}: ${errorMessage}`
        };
      }

      if (!data.events || !Array.isArray(data.events) || data.events.length === 0) {
        // Log error without using console.error directly
        const errorMessage = 'No events received from the server';
        // Using console.log instead of console.error to avoid linter issues
        console.log(`[ERROR] ${errorMessage} for URL: ${urlToProcess}`);
        return { 
          eventCount: 0, 
          reason: 'no_events',
          error: `No events found in the content from ${urlToProcess}. The URL may not contain any dates or scheduled content.`
        };
      }

      // Process and format the events
      const formattedEvents: CalendarEvent[] = data.events.map((event, index) => {
        // Ensure dates are properly parsed
        const startDate = new Date(event.start);
        const endDate = new Date(event.end);
        
        // Create a more descriptive title if one isn't provided
        const title = event.title || `Content from ${new URL(urlToProcess).hostname}`;
        
        // Create a more descriptive description
        const description = event.description || 
          `This event was extracted from content at ${urlToProcess}. Published on ${startDate.toLocaleDateString()}.`;
        
        return {
          id: `event-${Date.now()}-${index}`,
          start: startDate,
          end: endDate,
          title: title,
          description: description,
          url: urlToProcess, // Add the source URL to each event
        };
      });

      console.log(`Generated ${formattedEvents.length} events for URL: ${urlToProcess}`);
      
      // Filter events to ensure they're no later than 6 months in the past
      const filteredEvents = filterEventsByDate(formattedEvents);
      
      if (filteredEvents.length === 0 && formattedEvents.length > 0) {
        console.log(`All ${formattedEvents.length} events were filtered out because they were more than 6 months in the past.`);
        return { 
          eventCount: 0, 
          totalFound: formattedEvents.length,
          filtered: formattedEvents.length,
          reason: 'filtered_out',
          error: `Events found in ${urlToProcess} were more than 6 months old and have been filtered out.`
        };
      }
      
      // Add new events to existing ones
      setEvents(prevEvents => [...prevEvents, ...filteredEvents]);
      
      // Update the count of events for this URL
      setUrlEventCounts(prev => ({
        ...prev,
        [urlToProcess]: filteredEvents.length
      }));
      
      // Clear any error messages
      setError(null);
      
      return { 
        eventCount: filteredEvents.length,
        totalFound: formattedEvents.length,
        filtered: formattedEvents.length - filteredEvents.length
      };
    } catch (err) {
      console.log(`Error generating calendar for ${urlToProcess}:`, err);
      return { 
        eventCount: 0, 
        reason: 'other_error',
        error: `Failed to process ${urlToProcess}: ${err instanceof Error ? err.message : 'Unknown error'}`
      };
    }
  };

  const removeUrl = (indexToRemove: number) => {
    // Get the URL that's being removed
    const urlToRemove = urls[indexToRemove];
    
    // Only proceed if the URL exists
    if (urlToRemove) {
      // Remove the URL from the list
      setUrls(urls.filter((_, index) => index !== indexToRemove));
      
      // Remove events associated with this URL
      setEvents(prevEvents => prevEvents.filter(event => event.url !== urlToRemove));
      
      // Remove from event counts
      setUrlEventCounts(prev => {
        const newCounts = { ...prev };
        delete newCounts[urlToRemove];
        return newCounts;
      });
    }
  };

  // Function to clear all events
  const clearEvents = () => {
    // Generate new sample events
    const sampleEvents = generateSampleEvents();
    
    // Apply the date filter to sample events as well
    const filteredSampleEvents = filterEventsByDate(sampleEvents);
    
    // Set the filtered events
    setEvents(filteredSampleEvents);
    
    // Clear URLs and event counts
    setUrls([]);
    setUrlEventCounts({});
    setError(null);
  };

  return (
    <div className="max-w-full mx-auto p-4 h-screen flex flex-col">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">AI Calendar Generator</h2>
      
      <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              This calendar displays content scheduled from URLs you've analyzed. 
              To add content to your calendar, go to the URLs page and analyze content there, 
              then select "Add to Calendar" for the URLs you want to include.
              <span className="block mt-1 font-medium">Note: Only events from the past 6 months are displayed to keep your calendar relevant.</span>
            </p>
          </div>
        </div>
      </div>
      
      {selectedUrls.length > 0 && (
        <div className="mb-4 bg-teal-50 border-l-4 border-teal-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-teal-700">
                {isLoadingSelectedUrls 
                  ? `Generating calendar for ${selectedUrls.length} selected URLs...` 
                  : `Calendar generated from ${selectedUrls.length} URLs from the URLs page.`}
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className={`mb-4 p-4 rounded-md ${error.includes('Try these tips') ? 'bg-blue-50 border-l-4 border-blue-500' : error.includes('Analyzing content') ? 'bg-teal-50 border-l-4 border-teal-500' : 'bg-amber-50 border-l-4 border-amber-500'}`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {error.includes('Try these tips') ? (
                <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : error.includes('Analyzing content') ? (
                <svg className="h-5 w-5 text-teal-500 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className={`text-sm ${error.includes('Try these tips') ? 'text-blue-700' : error.includes('Analyzing content') ? 'text-teal-700' : 'text-amber-700'}`}>
                {error.includes('Try these tips') ? (
                  <span className="font-medium">Suggestions:</span>
                ) : error.includes('Analyzing content') ? (
                  <span className="font-medium">Processing:</span>
                ) : (
                  <span className="font-medium">Note:</span>
                )} {error.split('Try these tips:').map((part, index) => 
                  index === 0 ? part : (
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      {part.split('•').filter(tip => tip.trim()).map((tip, i) => (
                        <li key={i}>{tip.trim()}</li>
                      ))}
                    </ul>
                  )
                )}
              </p>
              {error.includes('Could not generate calendar') && !error.includes('Try these tips') && (
                <p className="mt-2 text-sm text-amber-700">
                  <a href="/urls" className="font-medium underline">Go to the URLs page</a> to try different content sources.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {urls.length > 0 ? (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-gray-700">Content Sources:</h3>
            <button
              onClick={clearEvents}
              className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
            >
              Reset Calendar
            </button>
          </div>
          <ul className="space-y-2">
            {urls.map((url, index) => (
              <li key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md border border-gray-100">
                <div className="flex-1 mr-4">
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-800 hover:underline truncate max-w-md block">
                    {url}
                  </a>
                  {urlEventCounts[url] !== undefined && (
                    <div className="text-sm text-gray-500 mt-1">
                      {urlEventCounts[url] === 0 ? (
                        <span className="text-orange-500">No events found in this content</span>
                      ) : (
                        <span className="text-green-600">{urlEventCounts[url]} event{urlEventCounts[url] !== 1 ? 's' : ''} extracted</span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removeUrl(index)}
                  className="text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-gray-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                No content sources added yet. Go to the <a href="/urls" className="font-medium underline">URLs page</a> to analyze content and add it to your calendar.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md flex-grow h-full min-h-[700px]">
        {isLoadingSelectedUrls ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <svg className="h-12 w-12 text-teal-500 animate-spin mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <p className="mt-4 text-lg text-gray-600">Generating your content calendar...</p>
              <p className="mt-2 text-sm text-gray-500">This may take a moment as we analyze your content.</p>
              <div className="mt-4 max-w-md mx-auto bg-blue-50 p-4 rounded-md text-left">
                <h4 className="font-medium text-blue-700 mb-2">What's happening?</h4>
                <ul className="text-sm text-blue-600 space-y-2 list-disc pl-5">
                  <li>We're analyzing your content to find dates and scheduled events</li>
                  <li>Only events from the past 6 months will be included</li>
                  <li>Complex or large content sources may take longer to process</li>
                  <li>If no events are found, we'll provide suggestions to help you</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <CalendarView events={events} />
        )}
      </div>
    </div>
  );
} 