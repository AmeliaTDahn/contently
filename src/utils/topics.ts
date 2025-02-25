import { extractKeywords } from './keywords';

/**
 * Extracts main topics from text content
 */
export function extractMainTopics(text: string): string[] {
  // Get keywords as base for topics
  const keywords = extractKeywords(text);
  
  // Group related keywords into topics
  const topics = new Map<string, string[]>();
  
  keywords.forEach(keyword => {
    let assigned = false;
    
    // Check if keyword belongs to existing topic
    for (const [topic, words] of topics.entries()) {
      if (areWordsRelated(keyword, words)) {
        topics.set(topic, [...words, keyword]);
        assigned = true;
        break;
      }
    }
    
    // Create new topic if not assigned
    if (!assigned) {
      topics.set(keyword, [keyword]);
    }
  });
  
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
  const topicFlow = paragraphs.map(paragraph => {
    const paragraphTopics = topics.filter(topic =>
      paragraph.toLowerCase().includes(topic.toLowerCase())
    );
    return paragraphTopics.length;
  });
  
  // Analyze topic transitions
  let abruptTransitions = 0;
  for (let i = 1; i < topicFlow.length; i++) {
    if (Math.abs(topicFlow[i] - topicFlow[i-1]) > 2) {
      abruptTransitions++;
    }
  }
  
  // Check if title topic is covered early
  const titleWords = new Set(title.toLowerCase().split(/\W+/));
  const firstParagraphTopics = topics.filter(topic =>
    paragraphs[0].toLowerCase().includes(topic.toLowerCase())
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

/**
 * Checks if words are semantically related
 */
function areWordsRelated(word: string, relatedWords: string[]): boolean {
  // Simple implementation checking for common prefixes/roots
  return relatedWords.some(related => 
    word.length > 4 && related.length > 4 &&
    (word.startsWith(related.substring(0, 4)) || 
     related.startsWith(word.substring(0, 4)))
  );
} 