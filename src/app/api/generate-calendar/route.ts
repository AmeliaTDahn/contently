import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { contentCalendars, calendarEntries } from '@/server/db/schema';
import { aggregateUserAnalytics } from '@/utils/aggregateAnalytics';
import { createCalendarPrompt } from '@/utils/createPrompt';
import { generateCalendar } from '@/utils/generateCalendar';

export async function POST(req: NextRequest) {
  try {
    const { userId, preferences } = await req.json() as {
      userId: string;
      preferences: { postsPerMonth: number; contentTypes: string[] };
    };

    if (!userId || !preferences?.postsPerMonth || !preferences?.contentTypes) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, postsPerMonth, or contentTypes' },
        { status: 400 }
      );
    }

    // Aggregate analytics data
    let aggregatedAnalytics;
    try {
      aggregatedAnalytics = await aggregateUserAnalytics(userId);
    } catch (error) {
      console.error('Error aggregating analytics:', error);
      return NextResponse.json(
        { error: 'Failed to aggregate user analytics' },
        { status: 500 }
      );
    }

    // Generate prompt for OpenAI
    const prompt = createCalendarPrompt(aggregatedAnalytics, preferences);

    // Get calendar from OpenAI
    let calendarData;
    try {
      calendarData = await generateCalendar(prompt);
    } catch (error) {
      console.error('Error generating calendar with OpenAI:', error);
      return NextResponse.json(
        { error: 'Failed to generate calendar suggestions' },
        { status: 500 }
      );
    }

    // Store in database
    try {
      const [newCalendar] = await db
        .insert(contentCalendars)
        .values({
          userId,
          preferences,
        })
        .returning();

      const entries = calendarData.map((entry) => ({
        contentCalendarId: newCalendar.id,
        suggestedDate: new Date(entry.date),
        contentType: entry.contentType,
        topic: entry.topic,
        rationale: entry.rationale,
      }));

      const insertedEntries = await db
        .insert(calendarEntries)
        .values(entries)
        .returning();

      return NextResponse.json(
        { calendarId: newCalendar.id, entries: insertedEntries },
        { status: 200 }
      );
    } catch (error) {
      console.error('Error storing calendar in database:', error);
      return NextResponse.json(
        { error: 'Failed to store calendar in database' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error in calendar generation:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}