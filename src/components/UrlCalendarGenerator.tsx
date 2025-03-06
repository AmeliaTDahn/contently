"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import CalendarView from './CalendarView';

interface WeightedItem {
  name: string;
  weight: number;
  frequency?: number;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  url?: string;
  rationale?: string;
  contentType: string;
  visualStrategy?: {
    mainImage: string;
    infographics: string[];
    style: string;
  };
}

// Content strategy configuration
const contentStrategy = {
  contentTypes: [
    { name: 'Blog Post', frequency: 7, weight: 3 },
    { name: 'Social Media Post', frequency: 3, weight: 4 },
    { name: 'Newsletter', frequency: 14, weight: 2 },
    { name: 'Video', frequency: 21, weight: 2 },
    { name: 'Podcast', frequency: 28, weight: 1 },
    { name: 'Infographic', frequency: 14, weight: 2 },
    { name: 'Case Study', frequency: 30, weight: 1 },
    { name: 'Webinar', frequency: 45, weight: 1 },
    { name: 'Product Update', frequency: 30, weight: 1 },
    { name: 'Press Release', frequency: 30, weight: 1 }
  ] as WeightedItem[],
  
  platforms: [
    { name: 'Website', weight: 3 },
    { name: 'LinkedIn', weight: 4 },
    { name: 'Twitter', weight: 3 },
    { name: 'Instagram', weight: 2 },
    { name: 'YouTube', weight: 1 }
  ] as WeightedItem[],
  
  topics: [
    { name: 'Industry Trends', weight: 3 },
    { name: 'How-to Guides', weight: 4 },
    { name: 'Case Studies', weight: 2 },
    { name: 'Product Features', weight: 2 },
    { name: 'Company News', weight: 1 }
  ] as WeightedItem[]
};

// Function to generate weighted random selection
const weightedRandom = <T extends WeightedItem>(items: T[]): T => {
  if (items.length === 0) throw new Error("Items array cannot be empty");
  
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  
  // Find the first item where the cumulative weight exceeds the random value
  let cumulativeWeight = 0;
  for (const item of items) {
    cumulativeWeight += item.weight;
    if (random <= cumulativeWeight) {
      return item as T;
    }
  }
  
  // Fallback to first item (should rarely happen due to floating-point precision)
  return items[0] as T;
};

// Function to generate sample events
const generateSampleEvents = (startDate: Date, numDays: number): CalendarEvent[] => {
  const events: CalendarEvent[] = [];
  const currentDate = new Date(startDate);

  for (let i = 0; i < numDays; i++) {
    const contentType = weightedRandom(contentStrategy.contentTypes);
    if (!contentType.frequency) continue;

    if (i % contentType.frequency === 0) {
      const platform = weightedRandom(contentStrategy.platforms);
      const topic = weightedRandom(contentStrategy.topics);
      const stages = ['Draft', 'Review', 'Publish'];

      for (const stage of stages) {
        const eventDate = new Date(currentDate);
        eventDate.setDate(currentDate.getDate() + i);

        const title = `${stage}: ${contentType.name} - ${topic.name}`;
        const description = `${stage} ${contentType.name.toLowerCase()} about ${topic.name.toLowerCase()} for ${platform.name}`;

        events.push({
          id: `${i}-${stage}-${contentType.name}`,
          title,
          start: eventDate,
          end: eventDate,
          description,
          contentType: contentType.name,
          url: stage === 'Publish' ? `https://example.com/${platform.name.toLowerCase()}/content/${i}` : undefined,
          rationale: `Strategic content piece targeting ${platform.name} audience with focus on ${topic.name}`
        });
      }
    }
  }

  return events;
};

export default function UrlCalendarGenerator() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { user } = useAuth();

  const handleGenerateEvents = () => {
    setIsGenerating(true);
    const sampleEvents = generateSampleEvents(new Date(), 180);
    setEvents(sampleEvents);
    setIsGenerating(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Content Calendar Generator</h2>
        <button
          onClick={handleGenerateEvents}
          disabled={isGenerating}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isGenerating ? 'Generating...' : 'Generate Sample Events'}
        </button>
      </div>
      <CalendarView events={events} />
    </div>
  );
} 