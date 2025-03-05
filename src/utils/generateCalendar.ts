import OpenAI from 'openai';
import { env } from '@/env';
import { DateTime } from 'luxon';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

interface CalendarEntry {
  date: string;
  contentType: string;
  topic: string;
  rationale: string;
}

interface OpenAICalendarEntry {
  contentType: string;
  topic: string;
  rationale: string;
}

export async function generateCalendar(prompt: string): Promise<CalendarEntry[]> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content:
            'You are an AI content strategist tasked with creating an optimized content calendar. Return the response as a JSON object with a "calendar" array containing the entries. Dates should be in YYYY-MM-DD format and should be evenly distributed across the next 3 months, starting from tomorrow.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from OpenAI');
    }

    const parsedResponse = JSON.parse(responseContent);
    
    if (!parsedResponse.calendar || !Array.isArray(parsedResponse.calendar)) {
      throw new Error('Invalid response format from OpenAI');
    }

    // Get tomorrow's date as the starting point
    const tomorrow = DateTime.now().plus({ days: 1 }).startOf('day');

    // Validate and process each entry in the calendar
    const calendar = parsedResponse.calendar.map((entry: OpenAICalendarEntry, index: number) => {
      if (!entry.contentType || !entry.topic || !entry.rationale) {
        throw new Error('Invalid entry format in OpenAI response');
      }

      // Calculate the date for this entry
      // Distribute entries evenly across 3 months
      const daysToAdd = Math.floor((index * 90) / parsedResponse.calendar.length);
      const entryDate = tomorrow.plus({ days: daysToAdd });

      return {
        date: entryDate.toFormat('yyyy-MM-dd'),
        contentType: entry.contentType,
        topic: entry.topic,
        rationale: entry.rationale,
      };
    });

    // Sort calendar entries by date
    return calendar.sort((a: CalendarEntry, b: CalendarEntry) => 
      DateTime.fromISO(a.date) < DateTime.fromISO(b.date) ? -1 : 1
    );
  } catch (error) {
    console.error('Error generating calendar with OpenAI:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to generate calendar');
  }
}