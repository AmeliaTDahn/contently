import { stemmer } from 'stemmer';

/**
 * Checks if a word is related to any word in a list of words.
 * This is a simple implementation that checks for common stems and substrings.
 */
export function areWordsRelated(word: string, words: string[]): boolean {
  const wordStem = stemmer(word.toLowerCase());
  
  for (const otherWord of words) {
    const otherStem = stemmer(otherWord.toLowerCase());
    
    // Check if words have the same stem
    if (wordStem === otherStem) {
      return true;
    }
    
    // Check if one word is a substring of the other
    if (word.includes(otherWord) || otherWord.includes(word)) {
      return true;
    }
    
    // Check if words share a significant substring (at least 4 characters)
    const minLength = Math.min(word.length, otherWord.length);
    if (minLength >= 4) {
      for (let i = 0; i <= word.length - 4; i++) {
        const substring = word.substring(i, i + 4);
        if (otherWord.includes(substring)) {
          return true;
        }
      }
    }
  }
  
  return false;
} 