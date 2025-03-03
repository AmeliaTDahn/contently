"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import CalendarView from './CalendarView';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  url?: string;
}

// Content strategy configuration
const contentStrategy = {
  // Core content types with their recommended frequency (in days)
  contentTypes: {
    "Blog Post": { frequency: 7, weight: 3 },
    "Social Media Post": { frequency: 3, weight: 4 },
    "Newsletter": { frequency: 14, weight: 2 },
    "Video": { frequency: 21, weight: 2 },
    "Podcast": { frequency: 28, weight: 1 },
    "Infographic": { frequency: 14, weight: 2 },
    "Case Study": { frequency: 30, weight: 1 },
    "Webinar": { frequency: 45, weight: 1 },
    "Product Update": { frequency: 30, weight: 1 },
    "Press Release": { frequency: 30, weight: 1 }
  },
  
  // Content themes/topics with their strategic importance
  topics: [
    { name: "Industry Trends", weight: 3 },
    { name: "Product Features", weight: 3 },
    { name: "Customer Success Story", weight: 2 },
    { name: "How-To Guide", weight: 4 },
    { name: "Market Analysis", weight: 2 },
    { name: "Team Spotlight", weight: 1 },
    { name: "Company News", weight: 2 },
    { name: "Tips & Tricks", weight: 4 },
    { name: "Behind the Scenes", weight: 1 },
    { name: "Expert Interview", weight: 2 }
  ],
  
  // Distribution platforms
  platforms: [
    { name: "Website", weight: 4 },
    { name: "LinkedIn", weight: 4 },
    { name: "Twitter", weight: 3 },
    { name: "Instagram", weight: 3 },
    { name: "YouTube", weight: 2 },
    { name: "Medium", weight: 2 },
    { name: "Email", weight: 3 },
    { name: "TikTok", weight: 2 }
  ]
};

// Function to generate weighted random selection
const weightedRandom = <T extends { weight: number }>(items: T[]): T => {
  if (items.length === 0) throw new Error("Items array cannot be empty");
  
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < items.length; i++) {
    random -= items[i].weight;
    if (random <= 0) return items[i];
  }
  
  return items[0];
};

// Function to generate sample scheduled content events
const generateSampleEvents = (): CalendarEvent[] => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const sixMonthsLater = new Date(tomorrow);
  sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
  
  const sampleEvents: CalendarEvent[] = [];
  const usedDates = new Set<string>();
  
  // Generate events for each content type based on their frequency
  Object.entries(contentStrategy.contentTypes).forEach(([contentType, config]) => {
    let currentDate = new Date(tomorrow);
    
    while (currentDate < sixMonthsLater) {
      // Add some randomness to the frequency (±2 days)
      const randomOffset = Math.floor(Math.random() * 5) - 2;
      const daysToAdd = config.frequency + randomOffset;
      
      currentDate.setDate(currentDate.getDate() + daysToAdd);
      if (currentDate >= sixMonthsLater) break;
      
      // Skip if we already have an event on this date
      const dateKey = currentDate.toDateString();
      if (usedDates.has(dateKey)) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }
      
      // Random hour between 9 AM and 4 PM
      const hour = Math.floor(Math.random() * 8) + 9;
      const startTime = new Date(currentDate);
      startTime.setHours(hour, 0, 0, 0);
      
      // Duration based on content type (1-4 hours)
      const durationHours = Math.floor(Math.random() * 4) + 1;
      const endTime = new Date(startTime);
      endTime.setHours(startTime.getHours() + durationHours);
      
      // Select topic and platform based on weights
      const topic = weightedRandom(contentStrategy.topics);
      const platform = weightedRandom(contentStrategy.platforms);
      
      // Determine content stage based on date proximity
      let stage: string;
      const daysFromNow = Math.floor((startTime.getTime() - tomorrow.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysFromNow <= 7) {
        stage = "Publish";
      } else if (daysFromNow <= 14) {
        stage = "Review";
      } else {
        stage = "Draft";
      }
      
      const title = `${stage}: ${contentType} - ${topic.name}`;
      
      // Create strategic description
      let description = "";
      if (stage === "Draft") {
        description = `Create initial draft of ${contentType.toLowerCase()} about ${topic.name.toLowerCase()} for ${platform.name}. Focus on current industry trends and audience engagement.`;
      } else if (stage === "Review") {
        description = `Review and optimize ${contentType.toLowerCase()} about ${topic.name.toLowerCase()} for ${platform.name}. Ensure SEO best practices and content quality standards are met.`;
      } else {
        description = `Publish and promote ${contentType.toLowerCase()} about ${topic.name.toLowerCase()} on ${platform.name}. Monitor performance metrics and engagement levels.`;
      }
      
      sampleEvents.push({
        id: `strategy-event-${sampleEvents.length}`,
        title,
        start: startTime,
        end: endTime,
        description,
        url: stage === "Publish" ? `https://example.com/${platform.name.toLowerCase()}/content/${sampleEvents.length}` : undefined
      });
      
      usedDates.add(dateKey);
    }
  });
  
  // Sort events by date
  return sampleEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
};

export default function UrlCalendarGenerator() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateCalendar = () => {
    setIsGenerating(true);
    // Generate new sample events
    const sampleEvents = generateSampleEvents();
    setEvents(sampleEvents);
    setIsGenerating(false);
  };

  return (
    <div className="max-w-full mx-auto p-4 h-screen flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Content Strategy Calendar</h2>
        <button
          onClick={handleGenerateCalendar}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md transition-colors"
        >
          Generate Strategy
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md flex-grow h-full min-h-[700px]">
        {isGenerating ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <svg className="h-12 w-12 text-teal-500 animate-spin mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <p className="mt-4 text-lg text-gray-600">Generating your content strategy...</p>
            </div>
          </div>
        ) : (
          <CalendarView events={events} />
        )}
      </div>
    </div>
  );
} 