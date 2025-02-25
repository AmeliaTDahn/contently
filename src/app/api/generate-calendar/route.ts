import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { urls } = await request.json();
    
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: "Please provide at least one URL" },
        { status: 400 }
      );
    }

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate mock events based on the URLs
    const events = urls.flatMap((url, index) => {
      try {
        const baseDate = new Date();
        baseDate.setHours(9, 0, 0, 0); // Start at 9 AM
        
        const hostname = new URL(url).hostname;
        
        // Create different events based on the URL index
        return [
          {
            id: `${index}-1`,
            title: `Content Planning for ${hostname}`,
            start: new Date(baseDate.getTime() + (index * 24 + 24) * 60 * 60 * 1000),
            end: new Date(baseDate.getTime() + (index * 24 + 24) * 60 * 60 * 1000 + 60 * 60 * 1000),
            description: `Plan content strategy based on ${url}`,
            url
          },
          {
            id: `${index}-2`,
            title: `Content Creation for ${hostname}`,
            start: new Date(baseDate.getTime() + (index * 24 + 48) * 60 * 60 * 1000),
            end: new Date(baseDate.getTime() + (index * 24 + 48) * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
            description: `Create content based on insights from ${url}`,
            url
          },
          {
            id: `${index}-3`,
            title: `Review & Publish for ${hostname}`,
            start: new Date(baseDate.getTime() + (index * 24 + 72) * 60 * 60 * 1000),
            end: new Date(baseDate.getTime() + (index * 24 + 72) * 60 * 60 * 1000 + 60 * 60 * 1000),
            description: `Review and schedule content for publishing related to ${url}`,
            url
          }
        ];
      } catch (error) {
        console.error(`Error processing URL ${url}:`, error);
        // Return a generic event if URL parsing fails
        const baseDate = new Date();
        baseDate.setHours(9, 0, 0, 0);
        return [{
          id: `${index}-error`,
          title: `Content Planning for URL ${index + 1}`,
          start: new Date(baseDate.getTime() + (index * 24 + 24) * 60 * 60 * 1000),
          end: new Date(baseDate.getTime() + (index * 24 + 24) * 60 * 60 * 1000 + 60 * 60 * 1000),
          description: `Plan content strategy based on provided URL`,
          url
        }];
      }
    });

    // Convert Date objects to ISO strings for JSON serialization
    const serializedEvents = events.map(event => ({
      ...event,
      start: event.start.toISOString(),
      end: event.end.toISOString()
    }));

    return NextResponse.json({ events: serializedEvents });
  } catch (error) {
    console.error("Error generating calendar:", error);
    return NextResponse.json(
      { error: "Failed to generate calendar" },
      { status: 500 }
    );
  }
} 