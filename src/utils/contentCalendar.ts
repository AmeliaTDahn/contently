import { type AnalyticsResult } from '@/app/api/analyze-content/route';
import { DateTime } from 'luxon';

interface ContentIdea {
  topic: string;
  content_type: string | null;
  priority: number;
  reason: string;
}

interface RefreshTask {
  title: string;
  updates: string;
  priority: number;
  metric: string;
}

interface AnalysisData {
  new_content_ideas: ContentIdea[];
  refresh_tasks: RefreshTask[];
}

interface CalendarEvent {
  date: string;
  title: string;
  content_type: string | null;
  action: 'new' | 'refresh';
  rationale: string;
}

export function generateContentCalendar(
  analysis_data: AnalysisData,
  start_date: string,
  duration_months: number,
  cadence: 'weekly' | 'biweekly' | 'monthly' = 'weekly'
): CalendarEvent[] {
  // Convert all recommendations into a unified format
  const recommendations = [
    ...analysis_data.new_content_ideas.map(idea => ({
      title: idea.topic,
      content_type: idea.content_type || null,
      priority: idea.priority,
      action: 'new' as const,
      rationale: `Publish ${idea.content_type || 'content'} on ${idea.topic} because ${idea.reason}.`
    })),
    ...analysis_data.refresh_tasks.map(task => ({
      title: task.title,
      content_type: null as string | null,
      priority: task.priority,
      action: 'refresh' as const,
      rationale: `Refresh ${task.title} by ${task.updates} to improve ${task.metric}.`
    }))
  ].sort((a, b) => b.priority - a.priority);

  // Calculate total weeks based on duration_months
  const weeksPerMonth = 4.33;
  const totalWeeks = Math.ceil(duration_months * weeksPerMonth);

  // Determine interval based on cadence
  const intervalWeeks = {
    weekly: 1,
    biweekly: 2,
    monthly: Math.floor(weeksPerMonth)
  }[cadence];

  // Generate dates
  const calendar: CalendarEvent[] = [];
  let currentDate = DateTime.fromISO(start_date);

  // Assign recommendations to dates
  let recommendationIndex = 0;
  for (let week = 0; week < totalWeeks; week += intervalWeeks) {
    if (recommendationIndex >= recommendations.length) {
      recommendationIndex = 0; // Start over if we run out of recommendations
    }

    const recommendation = recommendations[recommendationIndex];
    if (!recommendation) {
      continue; // Skip if no recommendation is available
    }

    calendar.push({
      date: currentDate.toISODate() ?? currentDate.toFormat('yyyy-MM-dd'),
      title: recommendation.title,
      content_type: recommendation.content_type,
      action: recommendation.action,
      rationale: recommendation.rationale
    });

    currentDate = currentDate.plus({ weeks: intervalWeeks });
    recommendationIndex++;
  }

  return calendar;
} 