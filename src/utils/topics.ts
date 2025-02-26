import type { KeywordResult } from './keywords';
import { extractKeywords } from './keywords';
import { areWordsRelated } from './wordRelations';

/**
 * Extracts main topics from text content
 */
export function extractMainTopics(text: string): string[] {
  // Get keywords as base for topics
  const keywords = extractKeywords(text);
  
  // Group related keywords into topics
  const topics = groupIntoTopics(keywords);
  
  // Convert topic groups to main topics
  return Array.from(topics.keys()).slice(0, 5);
}

/**
 * Analyzes topic coherence in text content
 */
export function analyzeTopicCoherence(text: string, title: string): string {
  const paragraphs = text.split('\n').filter(p => p.trim().length > 0);
  const topics = extractMainTopics(text);
  
  // Check topic presence in each paragraph
  const topicFlow: number[] = paragraphs.map(paragraph => {
    const paragraphTopics = topics.filter(topic =>
      paragraph.toLowerCase().includes(topic.toLowerCase())
    );
    return paragraphTopics.length;
  });
  
  // Analyze topic transitions
  const abruptTransitions = analyzeTopicFlow(topicFlow);
  
  // Check if title topic is covered early
  const titleWords = new Set(title.toLowerCase().split(/\W+/));
  const firstParagraphTopics = topics.filter(topic =>
    paragraphs[0]?.toLowerCase().includes(topic.toLowerCase())
  );
  const titleTopicEarly = firstParagraphTopics.some(topic =>
    topic.split(/\W+/).some(word => titleWords.has(word.toLowerCase()))
  );
  
  // Generate coherence analysis
  if (abruptTransitions === 0 && titleTopicEarly) {
    return "Strong topic coherence with smooth transitions and clear connection to title";
  } else if (abruptTransitions <= 2 && titleTopicEarly) {
    return "Good topic coherence with mostly smooth transitions";
  } else if (abruptTransitions <= 2) {
    return "Moderate topic coherence but could be improved with better connection to title";
  } else {
    return "Topic coherence lacks smooth transitions between ideas";
  }
}

function analyzeTopicFlow(topicFlow: number[] | undefined): number {
  if (!topicFlow || !Array.isArray(topicFlow) || topicFlow.length < 2) {
    return 0;
  }

  let abruptTransitions = 0;
  const safeTopicFlow = [...topicFlow]; // Create a copy to ensure type safety
  
  for (let i = 1; i < safeTopicFlow.length; i++) {
    const current = safeTopicFlow[i];
    const previous = safeTopicFlow[i - 1];
    
    // Both current and previous are guaranteed to exist due to array copy
    if (typeof current === 'number' && typeof previous === 'number') {
      if (Math.abs(current - previous) > 2) {
        abruptTransitions++;
      }
    }
  }
  return abruptTransitions;
}

/**
 * Groups keywords into topics based on their relationships.
 * Keywords with higher scores become topic names.
 */
export function groupIntoTopics(keywords: KeywordResult[]): Map<string, string[]> {
  const topics = new Map<string, string[]>();

  // Sort keywords by score in descending order
  const sortedKeywords = [...keywords].sort((a, b) => b.score - a.score);

  for (const keyword of sortedKeywords) {
    let assigned = false;

    // Check if keyword belongs to existing topic
    for (const [topic, words] of topics.entries()) {
      if (areWordsRelated(keyword.word, words)) {
        topics.set(topic, [...words, keyword.word]);
        assigned = true;
        break;
      }
    }

    // If keyword doesn't belong to any existing topic, create a new one
    if (!assigned) {
      topics.set(keyword.word, [keyword.word]);
    }
  }

  return topics;
} 