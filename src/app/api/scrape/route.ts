import { type NextRequest } from 'next/server';
import { scrapeServerless } from '@/utils/scrapers/serverlessScraper';
import { db } from '@/server/db';
import { analyzedUrls, urlMetadata, urlContent } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

interface RequestBody {
  url: string;
  userId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as RequestBody;
    
    if (!body.url || typeof body.url !== 'string') {
      return new Response(
        JSON.stringify({
          error: {
            name: 'ValidationError',
            message: 'URL is required and must be a string'
          }
        }),
        { status: 400 }
      );
    }

    // Create a record in the analyzedUrls table
    const insertResult = await db.insert(analyzedUrls)
      .values({
        url: body.url,
        status: 'processing',
        userId: body.userId || null,
      })
      .returning();
    
    // Check if we have a valid record
    if (!insertResult || insertResult.length === 0) {
      throw new Error('Failed to create database record for URL');
    }
    
    // TypeScript type assertion to ensure urlRecord is not undefined
    const urlRecord = insertResult[0]!;

    try {
      // Perform the scraping
      const result = await scrapeServerless(body.url);

      if (result.error) {
        // Update the URL record with error information
        await db.update(analyzedUrls)
          .set({
            status: 'failed',
            errorMessage: result.error.message,
            completedAt: new Date(),
          })
          .where(eq(analyzedUrls.id, urlRecord.id));
      } else if (result.content) {
        // Save metadata if available
        if (result.content.metadata) {
          await db.insert(urlMetadata)
            .values({
              analyzedUrlId: urlRecord.id,
              title: result.content.metadata.title || null,
              description: result.content.metadata.description || null,
              keywords: result.content.metadata.keywords?.join(', ') || null,
              author: result.content.metadata.author || null,
              ogImage: result.content.metadata.ogImage || null,
            });
        }

        // Save content data
        await db.insert(urlContent)
          .values({
            analyzedUrlId: urlRecord.id,
            headings: result.content.headings || null,
            links: result.content.links || null,
            images: result.content.images || null,
            tables: result.content.tables || null,
            structuredData: result.content.structuredData || null,
            mainContent: result.content.mainContent || null,
            screenshot: result.content.screenshot || null,
          });

        // Update the URL record to completed
        await db.update(analyzedUrls)
          .set({
            status: 'completed',
            completedAt: new Date(),
          })
          .where(eq(analyzedUrls.id, urlRecord.id));
      }

      return new Response(JSON.stringify(result));
    } catch (scrapeError) {
      // Update the URL record with error information
      await db.update(analyzedUrls)
        .set({
          status: 'failed',
          errorMessage: scrapeError instanceof Error ? scrapeError.message : 'An unknown error occurred',
          completedAt: new Date(),
        })
        .where(eq(analyzedUrls.id, urlRecord.id));

      throw scrapeError;
    }
  } catch (e) {
    console.error('Error in scrape API:', e);
    return new Response(
      JSON.stringify({
        error: {
          name: e instanceof Error ? e.name : 'UnknownError',
          message: e instanceof Error ? e.message : 'An unknown error occurred',
          stack: e instanceof Error ? e.stack : undefined
        }
      }),
      { status: 500 }
    );
  }
} 