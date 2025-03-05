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
  rationale?: string;
  contentType: string;
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
  ] as const;

  type ContentType = typeof contentTypes[number]['id'];

  interface NewEventData {
    title: string;
    description: string;
    contentType: ContentType;
    start: Date;
    end: Date;
  }

  const defaultContentType = contentTypes[0].id;

  const [newEvent, setNewEvent] = useState<NewEventData>({
    title: '',
    description: '',
    contentType: defaultContentType,
    start: new Date(),
    end: new Date(),
  });

  // Update event style getter to use content type colors
  const eventStyleGetter = (event: object) => {
    const calendarEvent = event as CalendarEvent;
    const typeConfig = contentTypes.find(type => type.id === calendarEvent.contentType);
    
    return {
      style: {
        backgroundColor: typeConfig?.color || '#3b82f6',
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: '0',
        display: 'block',
        fontWeight: 500,
        fontSize: '0.85rem',
        cursor: 'pointer',
        padding: '2px 4px',
      },
      className: `event-${calendarEvent.contentType}`,
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
      contentType: newEvent.contentType
    };
    
    setCalendarEvents(prev => [...prev, event]);
    setShowNewEventModal(false);
    setNewEvent({
      title: '',
      description: '',
      contentType: defaultContentType,
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
  const EventComponent = (props: { event: object }) => {
    const event = props.event as CalendarEvent;
    const typeConfig = contentTypes.find(type => type.id === event.contentType);
    
    return (
      <div 
        title={event.description || event.title}
        className="px-1 py-0.5"
      >
        <div className="event-title flex items-center">
          <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: typeConfig?.color || '#3b82f6' }} />
          {event.title}
        </div>
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
      const idParts = event.id.split('-');
      const lastPart = idParts[idParts.length - 1];
      if (!lastPart) {
        throw new Error('Invalid event ID format');
      }
      
      const entryId = parseInt(lastPart);
      if (isNaN(entryId)) {
        throw new Error('Invalid event ID format');
      }

      const response = await fetch('/api/delete-calendar-entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ entryId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      // Update local state to remove the deleted event
      setCalendarEvents(currentEvents => currentEvents.filter(e => e.id !== event.id));
      setSelectedEvent(null);
      setShowModal(false);

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
    } catch (error) {
      console.error('Error deleting event:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete event');
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
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-900">{selectedEvent.title}</h3>
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
              {/* Date and Time */}
              <div className="text-sm text-gray-600">
                {format(selectedEvent.start, 'EEEE, MMMM d, yyyy')} at {format(selectedEvent.start, 'h:mm a')}
              </div>

              {/* Description Section */}
              {selectedEvent.description && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                  <p className="text-gray-600 text-sm whitespace-pre-wrap">{selectedEvent.description}</p>
                </div>
              )}

              {/* Rationale Section */}
              {selectedEvent.rationale && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Rationale</h4>
                  <p className="text-gray-600 text-sm whitespace-pre-wrap">{selectedEvent.rationale}</p>
                </div>
              )}

              {/* URL Link */}
              {selectedEvent.url && (
                <div className="pt-2">
                  <a
                    href={selectedEvent.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-teal-600 hover:text-teal-700"
                  >
                    <span>View Content</span>
                    <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => handleDeleteEvent(selectedEvent)}
                className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete Event
              </button>
              <button
                onClick={handleCloseModal}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
              >
                Close
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 text-sm text-red-600">
                {error}
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Event Modal */}
      {showNewEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
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
                  onChange={(e) => setNewEvent({ ...newEvent, contentType: e.target.value as ContentType })}
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