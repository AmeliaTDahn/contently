import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { calendarEntries } from '@/server/db/schema';

export async function POST(req: Request) {
  try {
    const { entryId } = await req.json();

    if (!entryId) {
      return NextResponse.json(
        { error: 'Missing required field: entryId' },
        { status: 400 }
      );
    }

    // Delete the calendar entry
    const deletedEntries = await db
      .delete(calendarEntries)
      .where(eq(calendarEntries.id, entryId))
      .returning();

    if (!deletedEntries || deletedEntries.length === 0) {
      return NextResponse.json(
        { error: 'Calendar entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Calendar entry deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting calendar entry:', error);
    return NextResponse.json(
      { error: 'Failed to delete calendar entry' },
      { status: 500 }
    );
  }
} 