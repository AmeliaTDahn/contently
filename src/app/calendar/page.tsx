import UrlCalendarGenerator from '@/components/UrlCalendarGenerator';
import Navbar from '@/components/Navbar';

export default function CalendarPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-16">
        <UrlCalendarGenerator />
      </main>
    </>
  );
} 