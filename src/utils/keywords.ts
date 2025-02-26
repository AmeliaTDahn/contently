import { JSDOM } from 'jsdom';
import { removeStopwords } from 'stopword';
import { stemmer } from 'stemmer';

export interface KeywordResult {
  word: string;
  count: number;
  score: number;
}

export function extractKeywords(html: string, options?: { maxKeywords?: number }): KeywordResult[] {
  const maxKeywords = options?.maxKeywords ?? 10;
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Get text content from important elements
  const title = document.querySelector('title')?.textContent ?? '';
  const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
  const metaKeywords = document.querySelector('meta[name="keywords"]')?.getAttribute('content') ?? '';
  const headings = Array.from(document.querySelectorAll<HTMLHeadingElement>('h1, h2, h3'))
    .map(h => h.textContent ?? '')
    .join(' ');
  const paragraphs = Array.from(document.querySelectorAll<HTMLParagraphElement>('p'))
    .map(p => p.textContent ?? '')
    .join(' ');

  // Combine all text content with appropriate weighting
  const text = [
    title.repeat(3), // Title is most important
    metaDescription.repeat(2), // Meta description is second most important
    metaKeywords.repeat(2), // Meta keywords are also important
    headings.repeat(2), // Headings are important
    paragraphs, // Regular paragraphs have normal weight
  ].join(' ');

  // Clean and normalize text
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(/\s+/) // Split on whitespace
    .filter(word => word.length > 2); // Remove short words

  // Remove stopwords and stem remaining words
  const processedWords = removeStopwords(words)
    .map(word => stemmer(word));

  // Count word frequencies
  const wordCounts = new Map<string, number>();
  for (const word of processedWords) {
    wordCounts.set(word, (wordCounts.get(word) ?? 0) + 1);
  }

  // Calculate scores based on frequency and position
  const results: KeywordResult[] = Array.from(wordCounts.entries())
    .map(([word, count]) => {
      // Score is based on count and whether the word appears in important elements
      const inTitle = title.toLowerCase().includes(word) ? 3 : 0;
      const inMeta = (metaDescription + metaKeywords).toLowerCase().includes(word) ? 2 : 0;
      const inHeadings = headings.toLowerCase().includes(word) ? 2 : 0;
      const score = count + inTitle + inMeta + inHeadings;

      return { word, count, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, maxKeywords);

  return results;
}

/**
 * Calculates keyword density for given keywords in text
 */
export function calculateKeywordDensity(text: string, keywords: string[]): Record<string, number> {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2);

  const totalWords = words.length;
  const density: Record<string, number> = {};

  keywords.forEach(keyword => {
    const count = words.filter(word => word === keyword).length;
    density[keyword] = count / totalWords;
  });

  return density;
}

/**
 * Analyzes keyword usage and distribution in text
 */
export function analyzeKeywordUsage(text: string, keywords: string[]): {
  distribution: number;
  overuse: string[];
  underuse: string[];
} {
  const paragraphs = text.split('\n').filter(p => p.trim().length > 0);
  const density = calculateKeywordDensity(text, keywords);
  
  // Check keyword distribution across paragraphs
  const keywordPresence = new Map<string, number>();
  keywords.forEach(keyword => {
    const paragraphsWithKeyword = paragraphs.filter(p => 
      p.toLowerCase().includes(keyword.toLowerCase())
    ).length;
    keywordPresence.set(keyword, paragraphsWithKeyword / paragraphs.length);
  });

  // Identify overused and underused keywords
  const overuse: string[] = [];
  const underuse: string[] = [];
  
  keywords.forEach(keyword => {
    const keywordDensity = density[keyword];
    if (keywordDensity !== undefined) {
      if (keywordDensity > 0.03) { // More than 3% density is considered overuse
        overuse.push(keyword);
      } else if (keywordDensity < 0.005) { // Less than 0.5% density might be underuse
        underuse.push(keyword);
      }
    }
  });

  // Calculate overall distribution score
  const distribution = Array.from(keywordPresence.values())
    .reduce((sum, presence) => sum + presence, 0) / keywords.length;

  return {
    distribution,
    overuse,
    underuse
  };
} 