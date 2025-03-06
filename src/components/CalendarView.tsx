"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Calendar as BigCalendar, dateFnsLocalizer, type View, SlotInfo } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { format, parse, startOfWeek, getDay, addDays, addWeeks, addMonths, subDays, subWeeks, subMonths } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "@/styles/calendar.css";
import { useAuth } from "@/lib/auth-context";

// Add custom CSS for URL events
const customCalendarStyles = `
  .event-with-url {
    border-left: 3px solid #2563eb !important;
  }
  
  .event-with-visuals {
    border-right: 3px solid #10b981 !important;
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

  .event-visual-indicator {
    position: absolute;
    right: 4px;
    top: 4px;
    width: 16px;
    height: 16px;
    color: #059669;
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
  rationale?: string;
  contentType: string;
  visualStrategy?: {
    mainImage: string;
    infographics: string[];
    style: string;
  };
}

interface CalendarViewProps {
  events: CalendarEvent[];
}

interface CustomToolbarProps {
  label: string;
  onView: (view: View) => void;
  onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY') => void;
  view: View;
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

// Custom toolbar component for the calendar
function CustomToolbar({ label, onView, onNavigate, view }: CustomToolbarProps) {
  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('PREV')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Previous"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => onNavigate('TODAY')}
            className="px-3 py-1 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm font-medium transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => onNavigate('NEXT')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Next"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <span className="text-lg font-medium text-gray-900 ml-2">{label}</span>
        </div>
      </div>
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => onView('month')}
          className={`px-3 py-1 rounded-md text-sm transition-colors ${
            view === 'month' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          Month
        </button>
        <button
          onClick={() => onView('week')}
          className={`px-3 py-1 rounded-md text-sm transition-colors ${
            view === 'week' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          Week
        </button>
        <button
          onClick={() => onView('day')}
          className={`px-3 py-1 rounded-md text-sm transition-colors ${
            view === 'day' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          Day
        </button>
      </div>
    </div>
  );
}

export default function CalendarView({ events }: CalendarViewProps) {
  const [view, setView] = useState<View>("month");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const calendarRef = useRef<HTMLDivElement>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(events);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showNewEventModal, setShowNewEventModal] = useState(false);

  // Add style tag to head
  useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.textContent = customCalendarStyles;
    document.head.appendChild(styleTag);
    return () => {
      document.head.removeChild(styleTag);
    };
  }, []);

  // Update calendar events when the events prop changes
  useEffect(() => {
    setCalendarEvents(events);
  }, [events]);

  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event as CalendarEvent);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setSelectedEvent(null);
    setShowModal(false);
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
  const startAccessor = (event: object) => (event as CalendarEvent).start;
  const endAccessor = (event: object) => (event as CalendarEvent).end;

  // Add content type options
  const contentTypes = [
    { id: 'instagram', label: 'Instagram', color: '#E1306C' },
    { id: 'youtube', label: 'YouTube', color: '#FF0000' },
    { id: 'twitter', label: 'Twitter', color: '#1DA1F2' },
    { id: 'blog', label: 'Blog Post', color: '#14b8a6' },
    { id: 'podcast', label: 'Podcast', color: '#8B5CF6' },
  ];

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    contentType: contentTypes[0]?.id || 'blog',
    start: new Date(),
    end: new Date(),
  });

  // Update event style getter to use content type colors
  const eventStyleGetter = (event: object) => {
    const calendarEvent = event as CalendarEvent;
    const style: React.CSSProperties = {
      backgroundColor: 'white',
      color: '#374151',
      border: '1px solid #e5e7eb',
      borderRadius: '0.375rem',
      padding: '0.25rem'
    };

    return {
      style,
      className: `${calendarEvent.url ? 'event-with-url' : ''}`
    };
  };

  const handleNewEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const event: CalendarEvent = {
      id: `${newEvent.contentType}-${Date.now()}`,
      title: newEvent.title,
      start: newEvent.start,
      end: newEvent.end,
      description: newEvent.description,
      contentType: newEvent.contentType,
    };
    
    setCalendarEvents(prev => [...prev, event]);
    setShowNewEventModal(false);
    setNewEvent({
      title: '',
      description: '',
      contentType: contentTypes[0]?.id || 'blog',
      start: new Date(),
      end: new Date(),
    });

    // Show success toast
    const toast = document.createElement('div');
    toast.className = 'event-update-toast';
    toast.textContent = 'Content added successfully';
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  };

  // Custom event component to show URL source
  const EventComponent = ({ event }: { event: object }) => {
    const calendarEvent = event as CalendarEvent;
    const hasUrl = Boolean(calendarEvent.url);
    const hasVisuals = Boolean(calendarEvent.visualStrategy);
    
    return (
      <div className={`h-full ${hasUrl ? 'event-with-url' : ''} ${hasVisuals ? 'event-with-visuals' : ''} relative`}>
        <div className="event-title">{calendarEvent.title}</div>
        {calendarEvent.url && (
          <div className="event-url">{calendarEvent.url}</div>
        )}
        {hasVisuals && (
          <svg 
            className="event-visual-indicator" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
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

  // Add delete event handler
  const handleDeleteEvent = async (event: CalendarEvent) => {
    try {
      const eventId = parseInt(event.id);
      if (isNaN(eventId)) {
        setError('Invalid event ID');
        return;
      }
      
      const response = await fetch('/api/delete-calendar-entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ entryId: eventId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete event');
      }

      // Remove the event from the calendar
      setCalendarEvents(prevEvents => prevEvents.filter(e => e.id !== event.id));
      setError(null);

      // Show success toast
      const toast = document.createElement('div');
      toast.className = 'event-update-toast';
      toast.textContent = 'Event deleted successfully';
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => {
          document.body.removeChild(toast);
        }, 300);
      }, 3000);
    } catch (err) {
      console.error('Error deleting event:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <div className="h-[calc(100vh-13rem)]" ref={calendarRef} tabIndex={0}>
      {/* Calendar Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {contentTypes.map(type => (
            <div key={type.id} className="flex items-center space-x-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: type.color }}
              />
              <span className="text-sm text-gray-600">{type.label}</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => setShowNewEventModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
        >
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Content
        </button>
      </div>

      <DragAndDropCalendar
        localizer={localizer}
        events={calendarEvents}
        startAccessor={startAccessor}
        endAccessor={endAccessor}
        style={{ height: '100%' }}
        views={['month', 'week', 'day']}
        defaultView="month"
        view={view}
        onView={setView}
        date={currentDate}
        onNavigate={date => setCurrentDate(date)}
        onSelectEvent={handleSelectEvent}
        onEventDrop={handleEventDrop}
        onEventResize={handleEventResize}
        eventPropGetter={eventStyleGetter}
        selectable
        resizable
        components={{
          toolbar: CustomToolbar,
          event: EventComponent,
        }}
      />

      {showModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-semibold text-gray-900">{selectedEvent.title}</h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Date & Time</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {format(selectedEvent.start, "PPpp")}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Content Type</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedEvent.contentType}</p>
                </div>

                {selectedEvent.description && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Description</h3>
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                      {selectedEvent.description}
                    </p>
                  </div>
                )}

                {selectedEvent.rationale && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Rationale</h3>
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                      {selectedEvent.rationale}
                    </p>
                  </div>
                )}

                {selectedEvent.visualStrategy && (
                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Visual Strategy</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Main Image</h4>
                        <ul className="mt-2 list-disc pl-5 text-sm text-gray-900">
                          <li>{selectedEvent.visualStrategy.mainImage}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {selectedEvent.url && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Reference URL</h3>
                    <a
                      href={selectedEvent.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 text-sm text-blue-600 hover:text-blue-800 break-all"
                    >
                      {selectedEvent.url}
                    </a>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    if (selectedEvent) {
                      handleDeleteEvent(selectedEvent);
                      handleCloseModal();
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Event Modal */}
      {showNewEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Add New Content</h3>
              <button
                onClick={() => setShowNewEventModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleNewEventSubmit} className="space-y-6">
              <div>
                <label htmlFor="contentType" className="block text-sm font-medium text-gray-700">
                  Content Type
                </label>
                <select
                  id="contentType"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
                  value={newEvent.contentType}
                  onChange={(e) => setNewEvent({ ...newEvent, contentType: e.target.value })}
                >
                  {contentTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  required
                  placeholder="Enter content title..."
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={3}
                  placeholder="Describe your content..."
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">
                    Publish Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    id="start-date"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
                    value={format(newEvent.start, "yyyy-MM-dd'T'HH:mm")}
                    onChange={(e) => {
                      const start = new Date(e.target.value);
                      const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour later
                      setNewEvent({ ...newEvent, start, end });
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 mt-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowNewEventModal(false)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                >
                  Add Content
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 