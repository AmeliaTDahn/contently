export interface ScraperError {
  message: string;
  name?: string;
  stack?: string;
}

export interface ScrapedContent {
  metadata: {
    title: string;
    description: string;
    keywords: string[];
    author: string;
    ogImage?: string;
  };
  headings: Array<{
    text: string;
    level: number;
  }>;
  links: Array<{
    href: string;
    text: string;
  }>;
  images: Array<{
    src: string;
    alt: string;
  }>;
  tables: Array<{
    headers: string[];
    rows: string[][];
  }>;
  structuredData: Record<string, unknown>[];
  screenshot?: string;
}

export interface ScraperResult {
  error?: ScraperError;
  content?: ScrapedContent;
} 