// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

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
