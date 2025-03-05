import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { desc, eq } from 'drizzle-orm';
import { contentCalendars } from '@/server/db/schema';

export async function POST() {
  try {
    // Get the latest calendar
    const latestCalendar = await db.query.contentCalendars.findFirst({
      orderBy: [desc(contentCalendars.createdAt)],
    });

    if (!latestCalendar) {
      return NextResponse.json({ message: 'No calendar to clear' }, { status: 200 });
    }

    // Delete the calendar (this will cascade delete all entries due to foreign key constraint)
    await db.delete(contentCalendars).where(eq(contentCalendars.id, latestCalendar.id));

    return NextResponse.json({ message: 'Calendar cleared successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error clearing calendar:', error);
    return NextResponse.json(
      { error: 'Failed to clear calendar' },
      { status: 500 }
    );
  }
} 