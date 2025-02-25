"use client";

import { useState } from "react";
import { Calendar, dateFnsLocalizer, View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

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

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  const handleCloseModal = () => {
    setSelectedEvent(null);
  };

  // Ensure all events have valid Date objects
  const validEvents = events.map(event => ({
    ...event,
    start: event.start instanceof Date ? event.start : new Date(event.start),
    end: event.end instanceof Date ? event.end : new Date(event.end)
  }));

  // Custom event styling
  const eventStyleGetter = (event: CalendarEvent) => {
    const style = {
      backgroundColor: '#14b8a6', // Teal 500
      borderRadius: '4px',
      opacity: 0.9,
      color: 'white',
      border: '0',
      display: 'block',
      fontWeight: 500,
      fontSize: '0.85rem',
      padding: '2px 5px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    };
    return {
      style,
    };
  };

  // Custom day cell styling
  const dayPropGetter = (date: Date) => {
    return {
      style: {
        backgroundColor: 'white',
        border: '1px solid #f1f5f9', // Very light gray border
      },
    };
  };

  // Custom slot styling (time slots in week/day view)
  const slotPropGetter = () => {
    return {
      style: {
        border: '1px solid #f1f5f9', // Very light gray border
      },
    };
  };

  return (
    <div className="h-[700px]">
      <style jsx global>{`
        /* Override react-big-calendar default styles for a more modern look */
        .rbc-calendar {
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
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
      `}</style>
      
      <Calendar
        localizer={localizer}
        events={validEvents}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "100%" }}
        views={["month", "week", "day"]}
        view={view}
        onView={(newView) => setView(newView as View)}
        onSelectEvent={handleSelectEvent}
        eventPropGetter={eventStyleGetter}
        dayPropGetter={dayPropGetter}
        slotPropGetter={slotPropGetter}
        components={{
          toolbar: CustomToolbar,
        }}
      />

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
            <div className="mb-4">
              <div className="flex items-center text-gray-600 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>
                  {format(new Date(selectedEvent.start), "PPP")}
                </span>
              </div>
              <div className="flex items-center text-gray-600 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  {format(new Date(selectedEvent.start), "p")} - {format(new Date(selectedEvent.end), "p")}
                </span>
              </div>
              {selectedEvent.description && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-100">
                  <p className="text-gray-700">{selectedEvent.description}</p>
                </div>
              )}
            </div>
            {selectedEvent.url && (
              <div className="mt-4">
                <a
                  href={selectedEvent.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-teal-600 hover:text-teal-800"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View Related Content
                </a>
              </div>
            )}
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleCloseModal}
                className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Custom toolbar component for the calendar
function CustomToolbar({ label, onView, onNavigate, view }: any) {
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