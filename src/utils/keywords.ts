import { removeStopwords } from 'stopword';

/**
 * Extracts main keywords from text content
 */
export function extractKeywords(text: string): string[] {
  // Convert to lowercase and split into words
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2);

  // Remove stopwords
  const contentWords = removeStopwords(words);

  // Count word frequency
  const wordFreq = new Map<string, number>();
  contentWords.forEach(word => {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  });

  // Sort by frequency and get top keywords
  return Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
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
    if (keywordDensity > 0.03) { // More than 3% density is considered overuse
      overuse.push(keyword);
    } else if (keywordDensity < 0.005) { // Less than 0.5% density might be underuse
      underuse.push(keyword);
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