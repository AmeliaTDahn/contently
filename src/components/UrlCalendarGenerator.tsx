"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import CalendarView from "./CalendarView";

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  url?: string;
}

export default function UrlCalendarGenerator() {
  const { user } = useAuth();
  const [url, setUrl] = useState("");
  const [urls, setUrls] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addUrl = () => {
    if (!url) return;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      setError("Please enter a valid URL starting with http:// or https://");
      return;
    }
    
    setUrls([...urls, url]);
    setUrl("");
    setError(null);
  };

  const removeUrl = (indexToRemove: number) => {
    setUrls(urls.filter((_, index) => index !== indexToRemove));
  };

  const generateCalendar = async () => {
    if (urls.length === 0) {
      setError("Please add at least one URL");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Call our API endpoint to generate the calendar
      const response = await fetch('/api/generate-calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ urls }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate calendar');
      }
      
      // Convert string dates to Date objects
      const formattedEvents = data.events.map((event: any) => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
      }));
      
      setEvents(formattedEvents);
    } catch (err) {
      console.error("Calendar generation error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate calendar. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      addUrl();
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">AI Calendar Generator</h2>
      
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter a URL (e.g., https://example.com)"
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={addUrl}
            className="bg-teal-600 text-white px-6 py-2 rounded-md hover:bg-teal-700 transition-colors flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add URL
          </button>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 border border-red-100 flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}
        
        {urls.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-700">Added URLs:</h3>
            <ul className="space-y-2">
              {urls.map((url, index) => (
                <li key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md border border-gray-100">
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-800 hover:underline truncate max-w-md">
                    {url}
                  </a>
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
        )}
        
        <button
          onClick={generateCalendar}
          disabled={isGenerating || urls.length === 0}
          className={`w-full py-3 rounded-md font-medium flex items-center justify-center ${
            isGenerating || urls.length === 0
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-teal-600 text-white hover:bg-teal-700"
          } transition-colors`}
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Generate Calendar
            </>
          )}
        </button>
      </div>
      
      {events.length > 0 && (
        <div>
          <div className="flex items-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-800">Generated Calendar</h3>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4 mb-6">
            <CalendarView events={events} />
          </div>
          
          <div className="mt-6 space-y-4">
            <div className="flex items-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              <h4 className="text-lg font-medium text-gray-800">Event List</h4>
            </div>
            
            <div className="space-y-3">
              {events.map((event) => (
                <div key={event.id} className="bg-white p-4 rounded-md border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <h5 className="font-bold text-gray-800">{event.title}</h5>
                  <div className="flex items-center text-gray-500 text-sm mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      {new Date(event.start).toLocaleString()} - {new Date(event.end).toLocaleString()}
                    </span>
                  </div>
                  {event.description && <p className="mb-2 text-gray-600">{event.description}</p>}
                  {event.url && (
                    <a
                      href={event.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-600 hover:text-teal-800 hover:underline text-sm flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Visit Source
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 