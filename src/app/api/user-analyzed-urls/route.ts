import { type NextRequest } from 'next/server';
import { db } from '@/server/db';
import { analyzedUrls } from '@/server/db/schema';
import { eq, desc, or, isNull, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const url = searchParams.get('url');
    
    // If neither userId nor url is provided, return an empty array
    if (!userId && !url) {
      return new Response(JSON.stringify({ urls: [] }));
    }

    // Build the where clause based on provided parameters
    let whereClause;
    if (url) {
      whereClause = eq(analyzedUrls.url, url);
    } else if (userId) {
      whereClause = eq(analyzedUrls.userId, userId);
    }

    // Query the database for the URLs with their analytics
    const userUrls = await db.query.analyzedUrls.findMany({
      where: whereClause,
      orderBy: [desc(analyzedUrls.createdAt)],
      with: {
        analytics: true
      },
    });

    return new Response(JSON.stringify({ urls: userUrls }));
  } catch (e) {
    console.error('Error fetching user analyzed URLs:', e);
    return new Response(
      JSON.stringify({
        error: {
          name: e instanceof Error ? e.name : 'UnknownError',
          message: e instanceof Error ? e.message : 'An unknown error occurred',
        }
      }),
      { status: 500 }
    );
  }
}

// Also handle anonymous users by fetching URLs without a userId
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const urls = body.urls || [];
    
    if (!Array.isArray(urls) || urls.length === 0) {
      return new Response(JSON.stringify({ urls: [] }));
    }

    // Query the database for the specific URLs
    const matchedUrls = await db.query.analyzedUrls.findMany({
      where: or(...urls.map(url => eq(analyzedUrls.url, url))),
      orderBy: [desc(analyzedUrls.createdAt)],
    });

    return new Response(JSON.stringify({ urls: matchedUrls }));
  } catch (e) {
    console.error('Error fetching analyzed URLs by URL list:', e);
    return new Response(
      JSON.stringify({
        error: {
          name: e instanceof Error ? e.name : 'UnknownError',
          message: e instanceof Error ? e.message : 'An unknown error occurred',
        }
      }),
      { status: 500 }
    );
  }
}

// Add DELETE method to remove a URL from the database
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, userId } = body;
    
    if (!id) {
      return new Response(
        JSON.stringify({ error: { message: 'URL ID is required' } }),
        { status: 400 }
      );
    }

    // Delete the URL from the database
    // If userId is provided, ensure the URL belongs to that user
    let deleteCondition;
    if (userId) {
      deleteCondition = and(
        eq(analyzedUrls.id, id),
        eq(analyzedUrls.userId, userId)
      );
    } else {
      deleteCondition = eq(analyzedUrls.id, id);
    }

    const result = await db.delete(analyzedUrls)
      .where(deleteCondition)
      .returning({ id: analyzedUrls.id });

    if (result.length === 0) {
      return new Response(
        JSON.stringify({ error: { message: 'URL not found or not authorized to delete' } }),
        { status: 404 }
      );
    }

    return new Response(JSON.stringify({ success: true, deletedId: id }));
  } catch (e) {
    console.error('Error deleting analyzed URL:', e);
    return new Response(
      JSON.stringify({
        error: {
          name: e instanceof Error ? e.name : 'UnknownError',
          message: e instanceof Error ? e.message : 'An unknown error occurred',
        }
      }),
      { status: 500 }
    );
  }
} 