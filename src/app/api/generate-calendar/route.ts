import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { contentCalendars, calendarEntries } from '@/server/db/schema';
import { aggregateUserAnalytics } from '@/utils/aggregateAnalytics';
import { createCalendarPrompt } from '@/utils/createPrompt';
import { generateCalendar } from '@/utils/generateCalendar';

interface CalendarPreferences {
  postsPerMonth: number;
  contentTypes: string[];
  customPrompt?: string;
  contentPlan: Record<string, number>;
}

export async function POST(req: NextRequest) {
  try {
    console.log('Received calendar generation request');
    const body = await req.json();
    console.log('Request body:', body);

    const { userId, preferences } = body as {
      userId: string;
      preferences: CalendarPreferences;
    };

    if (!userId || !preferences?.contentPlan || !preferences?.contentTypes) {
      console.error('Missing required fields:', { userId, preferences });
      return NextResponse.json(
        { error: 'Missing required fields: userId, contentPlan, or contentTypes' },
        { status: 400 }
      );
    }

    // Validate that contentPlan matches contentTypes
    const totalPosts = Object.values(preferences.contentPlan).reduce((sum, count) => sum + count, 0);
    console.log('Total posts to generate:', totalPosts);
    console.log('Content plan:', preferences.contentPlan);
    
    if (totalPosts === 0) {
      console.error('No posts specified in content plan');
      return NextResponse.json(
        { error: 'Please specify at least one post in the content plan' },
        { status: 400 }
      );
    }

    // Aggregate analytics data
    let aggregatedAnalytics;
    try {
      console.log('Aggregating analytics for user:', userId);
      aggregatedAnalytics = await aggregateUserAnalytics(userId);
      console.log('Analytics aggregated successfully');
    } catch (error) {
      console.error('Error aggregating analytics:', error);
      return NextResponse.json(
        { error: 'Failed to aggregate user analytics' },
        { status: 500 }
      );
    }

    // Generate prompt for OpenAI
    console.log('Generating prompt with preferences:', preferences);
    const prompt = createCalendarPrompt(aggregatedAnalytics, preferences);
    console.log('Generated prompt:', prompt);

    // Get calendar from OpenAI
    let calendarData;
    try {
      console.log('Requesting calendar from OpenAI');
      calendarData = await generateCalendar(prompt);
      console.log('Received calendar data:', calendarData);
    } catch (error) {
      console.error('Error generating calendar with OpenAI:', error);
      return NextResponse.json(
        { error: 'Failed to generate calendar suggestions' },
        { status: 500 }
      );
    }

    // Store in database
    try {
      console.log('Storing calendar in database');
      const result = await db
        .insert(contentCalendars)
        .values({
          userId,
          preferences,
        })
        .returning();

      if (!result || result.length === 0) {
        console.error('Failed to create calendar record');
        return NextResponse.json(
          { error: 'Failed to create calendar record' },
          { status: 500 }
        );
      }

      const newCalendar = result[0];
      if (!newCalendar || !newCalendar.id) {
        console.error('Invalid calendar record:', newCalendar);
        return NextResponse.json(
          { error: 'Invalid calendar record created' },
          { status: 500 }
        );
      }

      console.log('Created calendar record:', newCalendar);

      const entries = calendarData.map((entry) => ({
        contentCalendarId: newCalendar.id,
        suggestedDate: new Date(entry.date),
        contentType: entry.contentType,
        topic: entry.topic,
        rationale: entry.rationale,
      }));

      console.log('Storing calendar entries:', entries);
      const insertedEntries = await db
        .insert(calendarEntries)
        .values(entries)
        .returning();

      console.log('Successfully stored entries:', insertedEntries);
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