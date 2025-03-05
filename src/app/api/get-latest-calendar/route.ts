import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { desc, eq } from 'drizzle-orm';
import { contentCalendars, calendarEntries } from '@/server/db/schema';

export async function GET() {
  try {
    // Get the latest calendar
    const latestCalendar = await db.query.contentCalendars.findFirst({
      orderBy: [desc(contentCalendars.createdAt)],
    });

    if (!latestCalendar) {
      return NextResponse.json({ entries: [] }, { status: 200 });
    }

    // Get all entries for this calendar
    const entries = await db.query.calendarEntries.findMany({
      where: eq(calendarEntries.contentCalendarId, latestCalendar.id),
      orderBy: [desc(calendarEntries.suggestedDate)],
    });

    return NextResponse.json({ entries }, { status: 200 });
  } catch (error) {
    console.error('Error fetching calendar entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar entries' },
      { status: 500 }
    );
  }
} 