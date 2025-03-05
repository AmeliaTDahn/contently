import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTableCreator,
  timestamp,
  varchar,
  text,
  json,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `contently_${name}`);

export const posts = createTable(
  "post",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    name: varchar("name", { length: 256 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date()
    ),
  },
  (example) => ({
    nameIndex: index("name_idx").on(example.name),
  })
);

// Enum for URL processing status
export const processingStatusEnum = pgEnum("processing_status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);

// Table for storing analyzed URLs
export const analyzedUrls = createTable(
  "analyzed_url",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    url: varchar("url", { length: 2048 }).notNull(),
    status: processingStatusEnum("status").default("pending").notNull(),
    errorMessage: text("error_message"),
    userId: varchar("user_id", { length: 256 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdate(() => new Date()),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => ({
    urlIndex: index("url_idx").on(table.url),
    userIdIndex: index("user_id_idx").on(table.userId),
    statusIndex: index("status_idx").on(table.status),
  })
);

// Table for storing metadata extracted from URLs
export const urlMetadata = createTable(
  "url_metadata",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    analyzedUrlId: integer("analyzed_url_id")
      .notNull()
      .references(() => analyzedUrls.id, { onDelete: "cascade" }),
    title: text("title"),
    description: text("description"),
    keywords: text("keywords"),
    author: varchar("author", { length: 256 }),
    ogImage: varchar("og_image", { length: 2048 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    analyzedUrlIdIndex: index("analyzed_url_id_idx").on(table.analyzedUrlId),
  })
);

// Table for storing content elements extracted from URLs
export const urlContent = createTable(
  "url_content",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    analyzedUrlId: integer("analyzed_url_id")
      .notNull()
      .references(() => analyzedUrls.id, { onDelete: "cascade" }),
    headings: json("headings").$type<{
      h1Tags: string[];
      headings: string[];
    }>(),
    links: json("links").$type<
      Array<{
        text: string;
        href: string;
        originalHref: string;
      }>
    >(),
    images: json("images").$type<
      Array<{
        src: string;
        alt: string;
      }>
    >(),
    tables: json("tables").$type<
      Array<{
        headers: string[];
        rows: string[][];
      }>
    >(),
    structuredData: json("structured_data"),
    mainContent: text("main_content"),
    screenshot: text("screenshot"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    analyzedUrlIdIndex: index("content_analyzed_url_id_idx").on(
      table.analyzedUrlId
    ),
  })
);

// Table for storing content analytics results
export const contentAnalytics = createTable(
  "content_analytics",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    analyzedUrlId: integer("analyzed_url_id")
      .notNull()
      .references(() => analyzedUrls.id, { onDelete: "cascade" }),
    // Core scores with explanations
    engagementScore: integer("engagement_score").notNull(),
    engagementExplanation: text("engagement_explanation"),
    contentQualityScore: integer("content_quality_score").notNull(),
    contentQualityExplanation: text("content_quality_explanation"),
    readabilityScore: integer("readability_score").notNull(),
    readabilityExplanation: text("readability_explanation"),
    seoScore: integer("seo_score").notNull(),
    seoExplanation: text("seo_explanation"),
    // Enhanced analysis fields with explanations
    industry: varchar("industry", { length: 100 }).notNull().default('General'),
    industryExplanation: text("industry_explanation"),
    scope: varchar("scope", { length: 50 }).notNull().default('General'),
    scopeExplanation: text("scope_explanation"),
    topics: json("topics").$type<string[]>().notNull().default([]),
    topicsExplanation: text("topics_explanation"),
    // Writing quality metrics with explanations
    writingQuality: json("writing_quality").$type<{
      grammar: number;
      clarity: number;
      structure: number;
      vocabulary: number;
      overall: number;
      explanations?: {
        grammar: string;
        clarity: string;
        structure: string;
        vocabulary: string;
        overall: string;
      };
    }>().notNull(),
    // Additional metrics with explanations
    audienceLevel: varchar("audience_level", { length: 50 }).notNull().default('General'),
    audienceLevelExplanation: text("audience_level_explanation"),
    contentType: varchar("content_type", { length: 100 }).notNull().default('Article'),
    contentTypeExplanation: text("content_type_explanation"),
    tone: varchar("tone", { length: 50 }).notNull().default('Neutral'),
    toneExplanation: text("tone_explanation"),
    estimatedReadTime: integer("estimated_read_time").notNull().default(0),
    // Keywords and analysis with explanations
    keywords: json("keywords").$type<Array<{
      text: string;
      count: number;
    }>>().notNull().default([]),
    keywordAnalysis: json("keyword_analysis").$type<{
      distribution: string;
      overused: string[];
      underused: string[];
      explanation?: string;
    }>().notNull(),
    // Insights
    insights: json("insights").$type<{
      engagement: string[];
      content: string[];
      readability: string[];
      seo: string[];
    }>().notNull(),
    // Stats
    wordCountStats: json("word_count_stats").$type<{
      count: number;
      min: number;
      max: number;
      avg: number;
      sum: number;
      explanations?: {
        count: string;
        min: string;
        max: string;
        avg: string;
        sum: string;
      };
    }>().notNull(),
    articlesPerMonth: json("articles_per_month").$type<Array<{
      date: string;
      count: number;
      explanation?: string;
    }>>().notNull().default([]),
    // Engagement metrics with explanations
    engagement: json("engagement").$type<{
      likes: number;
      comments: number;
      shares: number;
      bookmarks: number;
      totalViews: number;
      uniqueViews: number;
      avgTimeOnPage: number;
      bounceRate: number;
      socialShares: {
        facebook: number;
        twitter: number;
        linkedin: number;
        pinterest: number;
      };
      explanations?: {
        likes: string;
        comments: string;
        shares: string;
        bookmarks: string;
        totalViews: string;
        uniqueViews: string;
        avgTimeOnPage: string;
        bounceRate: string;
        socialShares: string;
      };
    }>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    analyzedUrlIdIndex: index("analytics_analyzed_url_id_idx").on(table.analyzedUrlId),
  })
);

// Table for storing content calendars
export const contentCalendars = createTable(
  "content_calendar",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    userId: varchar("user_id", { length: 256 }).notNull(),
    preferences: json("preferences").$type<{
      postsPerMonth?: number;
      contentTypes: string[];
      customPrompt?: string;
      contentPlan: Record<string, number>;
    }>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    userIdIndex: index("content_calendar_user_id_idx").on(table.userId),
  })
);

// Table for storing calendar entries
export const calendarEntries = createTable(
  "calendar_entry",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    contentCalendarId: integer("content_calendar_id")
      .notNull()
      .references(() => contentCalendars.id, { onDelete: "cascade" }),
    suggestedDate: timestamp("suggested_date", { withTimezone: true }).notNull(),
    contentType: varchar("content_type", { length: 100 }).notNull(),
    topic: varchar("topic", { length: 256 }),
    description: text("description").notNull(),
    rationale: text("rationale").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    contentCalendarIdIndex: index("calendar_entry_content_calendar_id_idx").on(
      table.contentCalendarId
    ),
    suggestedDateIndex: index("calendar_entry_suggested_date_idx").on(
      table.suggestedDate
    ),
  })
);