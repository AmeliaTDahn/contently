"use client";

import { useState, useEffect } from 'react';
import CalendarView from '@/components/CalendarView';
import Navbar from '@/components/Navbar';

interface ContentType {
  id: string;
  label: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  rationale?: string;
  url?: string;
  resource?: string;
  className?: string;
  style?: {
    backgroundColor?: string;
    border?: string;
    borderRadius?: string;
  };
}

interface CalendarEntry {
  suggestedDate: string;
  contentType: string;
  topic: string;
  description: string;
  rationale: string;
}

const contentTypes: ContentType[] = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'twitter', label: 'Twitter/X' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'blog', label: 'Blog Post' },
  { id: 'newsletter', label: 'Newsletter' },
  { id: 'podcast', label: 'Podcast' },
  { id: 'pinterest', label: 'Pinterest' },
  { id: 'medium', label: 'Medium' },
  { id: 'threads', label: 'Threads' }
];

// Function to get color for a content type
const getEventColor = (contentType: string | undefined): string => {
  const colors = {
    instagram: '#E1306C',
    youtube: '#FF0000',
    facebook: '#4267B2',
    twitter: '#1DA1F2',
    linkedin: '#0077B5',
    tiktok: '#000000',
    blog: '#14b8a6',
    newsletter: '#6366f1',
    podcast: '#8B4513',
    pinterest: '#E60023',
    medium: '#000000',
    threads: '#101010',
    default: '#6366f1'
  } as const;

  const key = contentType?.toLowerCase() ?? 'default';
  return colors[key as keyof typeof colors] || colors.default;
};

export default function CalendarPage() {
  const [contentPlan, setContentPlan] = useState<Record<string, number>>(() =>
    contentTypes.reduce((acc, type) => ({ ...acc, [type.id]: 0 }), {})
  );
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>('');

  // Fetch latest calendar entries when the page loads
  useEffect(() => {
    const fetchLatestCalendar = async () => {
      try {
        const response = await fetch('/api/get-latest-calendar');
        if (!response.ok) {
          throw new Error('Failed to fetch calendar entries');
        }
        
        const data = await response.json();
        if (data.entries && Array.isArray(data.entries)) {
          // Convert database entries to calendar events
          const calendarEvents = data.entries.map((entry: any) => ({
            id: `${entry.contentType}-${entry.id}`,
            title: `${entry.contentType} - ${entry.topic}`,
            start: new Date(entry.suggestedDate),
            end: new Date(new Date(entry.suggestedDate).setHours(new Date(entry.suggestedDate).getHours() + 1)),
            description: entry.description,
            rationale: entry.rationale,
            resource: entry.contentType,
            className: `event-${entry.contentType}`,
            style: {
              backgroundColor: getEventColor(entry.contentType),
              border: 'none',
              borderRadius: '4px',
            }
          }));
          setEvents(calendarEvents);
        }
      } catch (err) {
        console.error('Error fetching calendar entries:', err);
        setError('Failed to load calendar entries');
      }
    };

    fetchLatestCalendar();
  }, []);

  // Calculate total posts from content plan
  const totalPosts = Object.values(contentPlan).reduce((sum, count) => sum + count, 0);

  // Assume userId comes from auth context or props; hardcoding for simplicity
  const userId = 'example-user-id'; // Replace with actual user ID from auth

  const generateCalendar = async () => {
    setLoading(true);
    setError(null);

    const selectedTypes = contentTypes
      .filter((type) => {
        const count = contentPlan[type.id];
        return typeof count === 'number' && count > 0;
      })
      .map((type) => type.id);

    console.log('Selected content types:', selectedTypes);
    console.log('Content plan:', contentPlan);

    if (selectedTypes.length === 0 || totalPosts <= 0) {
      setError('Please specify at least one post type.');
      setLoading(false);
      return;
    }

    try {
      // Clear existing calendar first
      await fetch('/api/clear-calendar', {
        method: 'POST',
      });
      
      const requestBody = {
        userId,
        preferences: {
          contentTypes: selectedTypes,
          contentPlan,
          customPrompt: customPrompt.trim() || undefined,
        },
      };

      console.log('Sending request to API:', requestBody);

      const response = await fetch('/api/generate-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      console.log('API Response status:', response.status);
      const responseText = await response.text();
      console.log('API Response text:', responseText);

      if (!response.ok) {
        throw new Error(`Failed to generate calendar: ${responseText}`);
      }

      const data = JSON.parse(responseText);
      console.log('Parsed API Response:', data);

      if (!data.entries || !Array.isArray(data.entries)) {
        throw new Error('Invalid response format: missing entries array');
      }

      const { entries } = data;
      console.log('Calendar Entries:', entries);

      // Type guard function to validate entry format
      const isValidCalendarEntry = (entry: unknown): entry is CalendarEntry => {
        if (!entry || typeof entry !== 'object') return false;
        
        const e = entry as Record<string, unknown>;
        const contentType = e.contentType;
        
        if (
          !('suggestedDate' in e) ||
          !('contentType' in e) ||
          !('topic' in e) ||
          !('description' in e) ||
          !('rationale' in e) ||
          typeof e.suggestedDate !== 'string' ||
          typeof contentType !== 'string' ||
          !contentType ||
          typeof e.topic !== 'string' ||
          typeof e.description !== 'string' ||
          typeof e.rationale !== 'string'
        ) {
          return false;
        }

        // Brand the contentType as a valid ContentType
        return true;
      };

      // Validate entries before mapping
      if (!entries.every(isValidCalendarEntry)) {
        throw new Error('Invalid entry format: missing required fields');
      }

      // Convert entries to calendar events
      const calendarEvents: CalendarEvent[] = entries.map((entry: CalendarEntry) => {
        console.log('Processing entry:', entry);
        const startDate = new Date(entry.suggestedDate);
        console.log('Start date:', startDate);
        
        // Ensure we're working with valid dates
        if (isNaN(startDate.getTime())) {
          console.error('Invalid date for entry:', entry);
          throw new Error('Invalid date received from server');
        }
        
        const endDate = new Date(startDate);
        endDate.setHours(startDate.getHours() + 1); // Set end time to 1 hour after start

        // Since we've validated the entry with isValidCalendarEntry, we know contentType is a string
        const event: CalendarEvent = {
          id: `${entry.contentType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: `${entry.contentType} - ${entry.topic}`,
          start: startDate,
          end: endDate,
          description: entry.description,
          rationale: entry.rationale,
          resource: entry.contentType,
          className: `event-${entry.contentType}`,
          style: {
            backgroundColor: getEventColor(entry.contentType),
            border: 'none',
            borderRadius: '4px',
          }
        };
        console.log('Created event:', event);
        return event;
      });

      console.log('All calendar events:', calendarEvents);
      
      // Replace all events with new ones
      setEvents(calendarEvents);

      // Show success message
      const toast = document.createElement('div');
      toast.className = 'event-update-toast';
      toast.textContent = `Generated ${calendarEvents.length} new content items`;
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => {
          document.body.removeChild(toast);
        }, 300);
      }, 3000);

    } catch (err) {
      console.error('Calendar generation error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Function to clear all events
  const clearEvents = async () => {
    try {
      // Clear from database
      const response = await fetch('/api/clear-calendar', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to clear calendar');
      }
      
      // Clear from state
      setEvents([]);
    } catch (err) {
      console.error('Error clearing calendar:', err);
      setError('Failed to clear calendar');
    }
  };

  // Helper function to ensure contentType is valid
  const asContentType = (value: string): string & { __brand: 'ContentType' } => {
    if (!value || typeof value !== 'string') {
      throw new Error('Invalid content type');
    }
    return value as string & { __brand: 'ContentType' };
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-1 flex flex-col pb-24">
        {/* Preferences Form */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="mb-6">
              <h1 className="text-3xl font-semibold text-gray-900">Content Calendar</h1>
            </div>

            <div className="space-y-6">
              {/* Custom Prompt Input */}
              <div>
                <label className="block">
                  <span className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Instructions
                    <span className="ml-1 text-gray-500 font-normal">
                      (optional)
                    </span>
                  </span>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Add any specific requirements for your content calendar (e.g., 'Include posts about our upcoming product launch')"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 h-24 resize-none"
                  />
                </label>
              </div>

              {/* Content Type Inputs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {contentTypes.map((type) => (
                  <div key={type.id} className="relative group">
                    <label className="block">
                      <span className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <span 
                          className="inline-block w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: getEventColor(type.id) }}
                        />
                        {type.label}
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={contentPlan[type.id]}
                        onChange={(e) =>
                          setContentPlan((prev) => ({
                            ...prev,
                            [type.id]: Math.max(0, Number(e.target.value)),
                          }))
                        }
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                      />
                    </label>
                  </div>
                ))}
                
                {/* Total Posts Display */}
                <div className="col-span-2 sm:col-span-3 lg:col-span-4 xl:col-span-6 pt-4 border-t">
                  <p className="text-sm font-medium text-gray-700">
                    Total posts to generate: <span className="text-teal-600">{totalPosts}</span>
                  </p>
                </div>
              </div>

              {/* Generate and Clear Buttons */}
              <div className="flex justify-end gap-4">
                <button
                  onClick={clearEvents}
                  className="inline-flex items-center justify-center py-2 px-6 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                >
                  Clear Calendar
                </button>
                <button
                  onClick={generateCalendar}
                  disabled={loading}
                  className="inline-flex items-center justify-center py-2 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-gray-400 disabled:cursor-not-allowed min-w-[160px]"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    'Generate Calendar'
                  )}
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-4">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Calendar Display */}
        <div className="flex-1 bg-white h-[calc(100vh-20rem)] min-h-[600px] overflow-y-auto">
          <div className="h-full pb-24">
            <CalendarView events={events} />
          </div>
        </div>
      </main>
    </div>
  );
}