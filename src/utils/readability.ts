/**
 * Analyzes the readability of text content using various metrics
 */
export function analyzeReadability(text: string): number {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const syllables = countSyllables(text);
  
  // Calculate Flesch Reading Ease score
  const wordsPerSentence = words.length / sentences.length;
  const syllablesPerWord = syllables / words.length;
  const fleschScore = 206.835 - (1.015 * wordsPerSentence) - (84.6 * syllablesPerWord);
  
  // Normalize score to 0-100 range
  return Math.min(100, Math.max(0, fleschScore));
}

/**
 * Calculates the reading level of text content
 */
export function calculateReadingLevel(text: string): string {
  const score = analyzeReadability(text);
  
  if (score >= 90) return "Very Easy";
  if (score >= 80) return "Easy";
  if (score >= 70) return "Fairly Easy";
  if (score >= 60) return "Standard";
  if (score >= 50) return "Fairly Difficult";
  if (score >= 30) return "Difficult";
  return "Very Difficult";
}

/**
 * Counts the approximate number of syllables in text
 */
function countSyllables(text: string): number {
  const words = text.toLowerCase().split(/\s+/);
  return words.reduce((total, word) => total + countWordSyllables(word), 0);
}

/**
 * Counts syllables in a single word using basic rules
 */
function countWordSyllables(word: string): number {
  word = word.toLowerCase().trim();
  if (word.length <= 3) return 1;

  // Remove common endings
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');

  // Count vowel groups
  const syllables = word.match(/[aeiouy]{1,2}/g);
  return syllables ? syllables.length : 1;
} 