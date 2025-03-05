import { type NextRequest } from 'next/server';
import { generateCalendarWithAI } from '@/utils/openai';

interface RequestBody {
  analysis_data: {
    new_content_ideas: Array<{
      topic: string;
      content_type: string | null;
      priority: number;
      reason: string;
    }>;
    refresh_tasks: Array<{
      title: string;
      updates: string;
      priority: number;
      metric: string;
    }>;
  };
  start_date: string;
  duration_months: number;
  cadence?: 'weekly' | 'biweekly' | 'monthly';
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RequestBody;

    // Validate required fields
    if (!body.analysis_data || !body.start_date || !body.duration_months) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: analysis_data, start_date, or duration_months'
        }),
        { status: 400 }
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(body.start_date)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid start_date format. Expected YYYY-MM-DD'
        }),
        { status: 400 }
      );
    }

    // Generate content calendar using AI
    const result = await generateCalendarWithAI(
      body.analysis_data,
      body.start_date,
      body.duration_months,
      body.cadence
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error generating content calendar:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error'
      }),
      { status: 500 }
    );
  }
} 