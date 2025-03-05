import { type NextRequest } from 'next/server';
import { db } from '@/server/db';
import { calendarEvents } from '@/server/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, events } = body;

    if (!userId || !events || !Array.isArray(events)) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: userId and events array'
        }),
        { status: 400 }
      );
    }

    // Insert or update events
    const savedEvents = await Promise.all(
      events.map(async (event) => {
        const eventData = {
          userId,
          title: event.title,
          description: event.description || null,
          reasoning: {
            strategic_timing: event.rationale?.strategic_timing || '',
            audience_benefit: event.rationale?.audience_benefit || '',
            platform_specific: event.rationale?.platform_specific || '',
            content_strategy: event.rationale?.content_strategy || ''
          },
          startDate: new Date(event.start),
          endDate: new Date(event.end),
          contentType: event.content_type || null,
          action: event.action || 'new',
          strategicTiming: event.rationale?.strategic_timing || null,
          audienceBenefit: event.rationale?.audience_benefit || null,
          contentGuidelines: event.rationale?.content_guidelines || [],
          keyPoints: event.rationale?.key_points || [],
          url: event.url || null,
        };

        const [savedEvent] = await db
          .insert(calendarEvents)
          .values(eventData)
          .returning();

        return savedEvent;
      })
    );

    return new Response(JSON.stringify({ events: savedEvents }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error saving calendar events:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to save calendar events' }),
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: userId' }),
        { status: 400 }
      );
    }

    let query = db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.userId, userId));

    // Add date range filter if provided
    if (startDate && endDate) {
      query = query.where(
        and(
          gte(calendarEvents.startDate, new Date(startDate)),
          lte(calendarEvents.endDate, new Date(endDate))
        )
      );
    }

    const events = await query;

    // Transform events to match the calendar component's expected format
    const transformedEvents = events.map(event => ({
      id: event.id.toString(),
      title: event.title,
      description: event.description,
      start: event.startDate,
      end: event.endDate,
      content_type: event.contentType,
      action: event.action,
      url: event.url,
      rationale: {
        strategic_timing: event.reasoning?.strategic_timing || event.strategicTiming,
        audience_benefit: event.reasoning?.audience_benefit || event.audienceBenefit,
        platform_specific: event.reasoning?.platform_specific,
        content_strategy: event.reasoning?.content_strategy,
        content_guidelines: event.contentGuidelines,
        key_points: event.keyPoints
      }
    }));

    return new Response(JSON.stringify({ events: transformedEvents }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch calendar events' }),
      { status: 500 }
    );
  }
} 