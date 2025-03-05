"use client";

import { useState } from 'react';
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
  rationale: string;
}

const contentTypes: ContentType[] = [
  { id: 'instagram', label: 'Instagram post' },
  { id: 'youtube', label: 'YouTube video' },
  { id: 'facebook', label: 'Facebook post' },
  { id: 'blog', label: 'Blog post' },
];

const getEventColor = (contentType: string | undefined): string => {
  const colors: Record<string, string> = {
    instagram: '#E1306C',
    youtube: '#FF0000',
    facebook: '#4267B2',
    blog: '#14b8a6',
    default: '#6366f1'
  };
  return colors[contentType?.toLowerCase() ?? 'default'] || colors.default;
};

export default function CalendarPage() {
  const [contentPlan, setContentPlan] = useState<Record<string, number>>(() =>
    contentTypes.reduce((acc, type) => ({ ...acc, [type.id]: 0 }), {})
  );
  const [postsPerMonth, setPostsPerMonth] = useState<number>(0);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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

    if (selectedTypes.length === 0 || postsPerMonth <= 0) {
      setError('Please specify at least one content type and posts per month.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/generate-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          preferences: {
            postsPerMonth,
            contentTypes: selectedTypes,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate calendar');
      }

      const data = await response.json();
      console.log('API Response:', data);

      const { entries } = data as { calendarId: number; entries: CalendarEntry[] };
      console.log('Calendar Entries:', entries);

      // Convert entries to calendar events
      const calendarEvents: CalendarEvent[] = entries.map((entry) => {
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

        const contentType = entry.contentType || 'default';

        const event = {
          id: `${contentType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: `${contentType} - ${entry.topic}`,
          start: startDate,
          end: endDate,
          description: entry.rationale,
          resource: contentType,
          className: `event-${contentType.toLowerCase()}`,
          style: {
            backgroundColor: getEventColor(contentType),
            border: 'none',
            borderRadius: '4px',
          }
        };
        console.log('Created event:', event);
        return event;
      });

      console.log('All calendar events:', calendarEvents);
      
      // Update the calendar with new events
      setEvents((prevEvents) => {
        const newEvents = [...prevEvents, ...calendarEvents];
        console.log('Updated events state:', newEvents);
        return newEvents;
      });

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
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Function to clear all events
  const clearEvents = () => {
    setEvents([]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-1 flex flex-col pt-8">
        {/* Preferences Form */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-semibold text-gray-900">Content Calendar</h1>
            </div>

            <div className="space-y-8">
              {/* Content Type Inputs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block">
                    <span className="block text-sm font-medium text-gray-700 mb-2">Posts per month</span>
                    <input
                      type="number"
                      min="0"
                      value={postsPerMonth}
                      onChange={(e) => setPostsPerMonth(Math.max(0, Number(e.target.value)))}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                    />
                  </label>
                </div>
                
                {contentTypes.map((type) => (
                  <div key={type.id}>
                    <label className="block">
                      <span className="block text-sm font-medium text-gray-700 mb-2">{type.label}</span>
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
              </div>

              {/* Generate and Clear Buttons */}
              <div className="flex justify-end gap-4">
                <button
                  onClick={clearEvents}
                  className="inline-flex items-center justify-center py-3 px-8 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                >
                  Clear Calendar
                </button>
                <button
                  onClick={generateCalendar}
                  disabled={loading}
                  className="inline-flex items-center justify-center py-3 px-8 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-gray-400 disabled:cursor-not-allowed min-w-[160px]"
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

        {/* Calendar Display - Takes up remaining space */}
        <div className="flex-1 bg-white">
          <CalendarView events={events} />
        </div>
      </main>
    </div>
  );
}