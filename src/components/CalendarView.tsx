"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Calendar as BigCalendar, dateFnsLocalizer, type View, SlotInfo } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { format, parse, startOfWeek, getDay, addDays, addWeeks, addMonths, subDays, subWeeks, subMonths } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import { useAuth } from "@/lib/auth-context";

// Add custom CSS for URL events
const customCalendarStyles = `
  .event-with-url {
    border-left: 3px solid #2563eb !important;
  }
  
  .event-url {
    font-size: 0.7rem;
    opacity: 0.8;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }
  
  .event-title {
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

// Setup the localizer for react-big-calendar using date-fns
const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Create a drag-and-drop enabled calendar
const DragAndDropCalendar = withDragAndDrop(BigCalendar);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  url?: string;
}

interface CalendarViewProps {
  events: CalendarEvent[];
}

// Custom styling for the calendar
const calendarStyles = {
  // Add custom styles for the calendar components
  day: {
    today: {
      backgroundColor: '#f0fdfb', // Very light teal for today
    },
  },
  agenda: {
    time: {
      fontSize: '0.9em',
    },
  },
};

export default function CalendarView({ events }: CalendarViewProps) {
  const [view, setView] = useState<View>("month");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const calendarRef = useRef<HTMLDivElement>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(events);

  // Update calendar events when the events prop changes
  useEffect(() => {
    setCalendarEvents(events);
  }, [events]);

  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event as CalendarEvent);
  };

  const handleCloseModal = () => {
    setSelectedEvent(null);
  };

  // Handle event resizing and dragging
  const handleEventDrop = useCallback((dropInfo: any) => {
    const { event, start, end } = dropInfo;
    const updatedEvents = calendarEvents.map(existingEvent => 
      existingEvent.id === event.id 
        ? { ...existingEvent, start, end } 
        : existingEvent
    );
    
    setCalendarEvents(updatedEvents);
    
    // Show a toast notification
    const toast = document.createElement('div');
    toast.className = 'event-update-toast';
    toast.textContent = `"${event.title}" moved to ${format(start, 'PPp')}`;
    document.body.appendChild(toast);
    
    // Remove the toast after 3 seconds
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }, [calendarEvents]);

  const handleEventResize = useCallback((resizeInfo: any) => {
    const { event, start, end } = resizeInfo;
    const updatedEvents = calendarEvents.map(existingEvent => 
      existingEvent.id === event.id 
        ? { ...existingEvent, start, end } 
        : existingEvent
    );
    
    setCalendarEvents(updatedEvents);
    
    // Show a toast notification
    const toast = document.createElement('div');
    toast.className = 'event-update-toast';
    toast.textContent = `"${event.title}" resized to ${format(start, 'PPp')} - ${format(end, 'PPp')}`;
    document.body.appendChild(toast);
    
    // Remove the toast after 3 seconds
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }, [calendarEvents]);

  // Handle creating a new event by selecting a time slot
  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    const title = window.prompt('Enter a title for your content:');
    if (!title) return;
    
    const newEvent: CalendarEvent = {
      id: `event-${Date.now()}`,
      title,
      start: slotInfo.start,
      end: slotInfo.end,
      description: 'New scheduled content'
    };
    
    setCalendarEvents(prev => [...prev, newEvent]);
  }, []);

  // Navigation handlers
  const navigateToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const navigatePrevious = useCallback(() => {
    if (view === 'day') {
      setCurrentDate(prevDate => subDays(prevDate, 1));
    } else if (view === 'week') {
      setCurrentDate(prevDate => subWeeks(prevDate, 1));
    } else {
      setCurrentDate(prevDate => subMonths(prevDate, 1));
    }
  }, [view]);

  const navigateNext = useCallback(() => {
    if (view === 'day') {
      setCurrentDate(prevDate => addDays(prevDate, 1));
    } else if (view === 'week') {
      setCurrentDate(prevDate => addWeeks(prevDate, 1));
    } else {
      setCurrentDate(prevDate => addMonths(prevDate, 1));
    }
  }, [view]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Only handle keyboard events if the calendar is focused or no input elements are focused
    const activeElement = document.activeElement;
    const isInputFocused = activeElement && (
      activeElement.tagName === 'INPUT' || 
      activeElement.tagName === 'TEXTAREA' || 
      (activeElement as HTMLElement).isContentEditable
    );

    if (isInputFocused) return;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        navigatePrevious();
        break;
      case 'ArrowRight':
        e.preventDefault();
        navigateNext();
        break;
      case 'ArrowUp':
        if (view === 'day') {
          e.preventDefault();
          setView('week');
        } else if (view === 'week') {
          e.preventDefault();
          setView('month');
        }
        break;
      case 'ArrowDown':
        if (view === 'month') {
          e.preventDefault();
          setView('week');
        } else if (view === 'week') {
          e.preventDefault();
          setView('day');
        }
        break;
      case 'Home':
        e.preventDefault();
        navigateToday();
        break;
      default:
        break;
    }
  }, [view, navigatePrevious, navigateNext, navigateToday]);

  // Set up keyboard event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    
    // Focus the calendar container to enable keyboard navigation
    if (calendarRef.current) {
      calendarRef.current.focus();
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Ensure all events have valid Date objects
  const validEvents = calendarEvents.map(event => ({
    ...event,
    start: event.start instanceof Date ? event.start : new Date(event.start),
    end: event.end instanceof Date ? event.end : new Date(event.end)
  }));

  // Accessor functions for the calendar
  const startAccessor = (event: any) => event.start;
  const endAccessor = (event: any) => event.end;

  // Custom event styling
  const eventStyleGetter = (event: any) => {
    // Determine if this is a sample event or a real one from a URL
    const typedEvent = event as CalendarEvent;
    const isSampleEvent = typedEvent.id.startsWith('sample-event-');
    
    return {
      style: {
        backgroundColor: isSampleEvent ? '#14b8a6' : '#3b82f6', // Teal for sample events, Blue for URL events
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: '0',
        display: 'block',
        fontWeight: 500,
        fontSize: '0.85rem',
        cursor: 'pointer',
      },
      className: typedEvent.url ? 'event-with-url' : '',
    };
  };
  
  // Custom event component to show URL source
  const EventComponent = ({ event }: any) => {
    const typedEvent = event as CalendarEvent;
    return (
      <div title={typedEvent.url ? `Source: ${typedEvent.url}` : typedEvent.description}>
        <div className="event-title">{typedEvent.title}</div>
        {typedEvent.url && (
          <div className="event-url text-xs opacity-80 truncate">
            {new URL(typedEvent.url).hostname}
          </div>
        )}
      </div>
    );
  };

  // Custom day cell styling
  const dayPropGetter = () => ({
    style: {
      backgroundColor: 'white',
      border: '1px solid #f1f5f9', // Very light gray border
    },
  });

  // Custom slot styling (time slots in week/day view)
  const slotPropGetter = () => ({
    style: {
      border: '1px solid #f1f5f9', // Very light gray border
    },
  });

  return (
    <div 
      className="h-full" 
      ref={calendarRef} 
      tabIndex={0} // Make the div focusable for keyboard events
    >
      {/* Add custom styles */}
      <style jsx global>{customCalendarStyles}</style>
      
      <style jsx global>{`
        /* Override react-big-calendar default styles for a more modern look */
        .rbc-calendar {
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          height: 100% !important;
        }
        .rbc-header {
          font-weight: 500;
          font-size: 0.875rem;
          padding: 12px 0;
          border-bottom: 1px solid #f1f5f9;
        }
        .rbc-month-view {
          border: 1px solid #f1f5f9;
          border-radius: 8px;
          overflow: hidden;
          height: calc(100% - 70px) !important;
        }
        .rbc-month-row {
          min-height: 120px; /* Increase the minimum height of rows */
          overflow: visible;
        }
        .rbc-day-bg {
          transition: background-color 0.2s ease;
        }
        .rbc-day-bg:hover {
          background-color: #f8fafc;
        }
        .rbc-off-range {
          color: #cbd5e1;
        }
        .rbc-off-range-bg {
          background-color: #fafafa;
        }
        .rbc-today {
          background-color: #f0fdfb !important;
        }
        .rbc-event {
          border-radius: 4px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          border: none !important;
        }
        .rbc-event-content {
          font-size: 0.85rem;
          padding: 2px 5px;
        }
        .rbc-row-segment {
          padding: 2px 3px;
        }
        .rbc-date-cell {
          font-size: 0.9rem;
          padding: 8px;
          text-align: center;
        }
        .rbc-date-cell > a {
          color: #475569;
          font-weight: 500;
        }
        .rbc-date-cell.rbc-now > a {
          color: #0f766e;
          font-weight: 600;
        }
        .rbc-time-view {
          border: 1px solid #f1f5f9;
          border-radius: 8px;
          overflow: hidden;
          height: calc(100% - 70px) !important;
        }
        .rbc-time-header {
          border-bottom: 1px solid #f1f5f9;
        }
        .rbc-time-content {
          border-top: 1px solid #f1f5f9;
        }
        .rbc-timeslot-group {
          min-height: 50px; /* Increase the height of time slots */
        }
        .rbc-time-slot {
          font-size: 0.75rem;
          color: #64748b;
        }
        .rbc-current-time-indicator {
          background-color: #14b8a6;
          height: 1px;
        }
        .rbc-current-time-indicator::before {
          content: '';
          position: absolute;
          left: -5px;
          top: -2px;
          height: 5px;
          width: 5px;
          border-radius: 50%;
          background-color: #14b8a6;
        }
        /* Increase the size of day cells in week view */
        .rbc-time-view .rbc-day-slot {
          min-width: 120px;
        }
        /* Add more padding inside day cells */
        .rbc-day-bg, .rbc-day-slot {
          padding: 2px;
        }
        /* Make "more" link more visible */
        .rbc-show-more {
          font-size: 0.8rem;
          font-weight: 500;
          color: #0f766e;
          background-color: transparent;
          padding: 2px 5px;
        }
        
        /* Add focus outline for accessibility */
        .h-full:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(20, 184, 166, 0.3);
          border-radius: 8px;
        }
        
        /* Add a keyboard navigation hint */
        .keyboard-hint {
          position: absolute;
          bottom: 10px;
          right: 10px;
          background-color: rgba(255, 255, 255, 0.9);
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.7rem;
          color: #64748b;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
          z-index: 10;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .h-full:focus .keyboard-hint {
          opacity: 1;
        }
        
        /* Toast notification for event updates */
        .event-update-toast {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background-color: #14b8a6;
          color: white;
          padding: 10px 20px;
          border-radius: 4px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          font-size: 0.9rem;
          opacity: 1;
          transition: opacity 0.3s ease;
        }
        
        .event-update-toast.fade-out {
          opacity: 0;
        }
        
        /* Drag handle indicator */
        .rbc-event:hover::before {
          content: '⋮⋮';
          position: absolute;
          top: 2px;
          left: 2px;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.7);
        }
      `}</style>
      
      <DragAndDropCalendar
        ref={calendarRef as any}
        localizer={localizer}
        events={validEvents}
        startAccessor={startAccessor}
        endAccessor={endAccessor}
        style={{ height: "100%" }}
        view={view}
        onView={setView as any}
        date={currentDate}
        onNavigate={setCurrentDate}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        selectable
        resizable
        onEventDrop={handleEventDrop}
        onEventResize={handleEventResize}
        eventPropGetter={eventStyleGetter}
        dayPropGetter={dayPropGetter}
        slotPropGetter={slotPropGetter}
        components={{
          toolbar: CustomToolbar,
          event: EventComponent,
        }}
        popup
        formats={{
          eventTimeRangeFormat: () => '',
          timeGutterFormat: (date: Date) => format(date, 'h a'),
        }}
      />

      {/* Keyboard navigation hint */}
      <div className="keyboard-hint">
        Use arrow keys to navigate: ←→ (prev/next) | ↑↓ (zoom in/out) | Home (today)
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full border border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-800">{selectedEvent.title}</h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Start Time</p>
                <p className="text-gray-800">{format(selectedEvent.start, 'PPpp')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">End Time</p>
                <p className="text-gray-800">{format(selectedEvent.end, 'PPpp')}</p>
              </div>
              {selectedEvent.description && (
                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="text-gray-800">{selectedEvent.description}</p>
                </div>
              )}
              {selectedEvent.url && (
                <div>
                  <p className="text-sm text-gray-500">URL</p>
                  <a
                    href={selectedEvent.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-600 hover:text-teal-800 hover:underline break-all"
                  >
                    {selectedEvent.url}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Custom toolbar component for the calendar
interface CustomToolbarProps {
  label: string;
  onView: (view: View) => void;
  onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY') => void;
  view: View;
}

function CustomToolbar({ label, onView, onNavigate, view }: CustomToolbarProps) {
  return (
    <div className="flex flex-wrap justify-between items-center mb-6">
      <div className="flex items-center space-x-2 mb-2 sm:mb-0">
        <button
          onClick={() => onNavigate('TODAY')}
          className="px-3 py-1 rounded-md bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 text-sm font-medium transition-colors"
        >
          Today
        </button>
        <button
          onClick={() => onNavigate('PREV')}
          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={() => onNavigate('NEXT')}
          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <span className="text-lg font-medium text-gray-800">{label}</span>
      </div>
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-md">
        <button
          onClick={() => onView('month')}
          className={`px-3 py-1 rounded-md text-sm transition-colors ${
            view === 'month' 
              ? 'bg-white text-teal-700 shadow-sm' 
              : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          Month
        </button>
        <button
          onClick={() => onView('week')}
          className={`px-3 py-1 rounded-md text-sm transition-colors ${
            view === 'week' 
              ? 'bg-white text-teal-700 shadow-sm' 
              : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          Week
        </button>
        <button
          onClick={() => onView('day')}
          className={`px-3 py-1 rounded-md text-sm transition-colors ${
            view === 'day' 
              ? 'bg-white text-teal-700 shadow-sm' 
              : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          Day
        </button>
      </div>
    </div>
  );
} 