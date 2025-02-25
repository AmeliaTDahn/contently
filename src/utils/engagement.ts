/**
 * Finds engagement hooks and calls-to-action in content
 */
export function findHooksAndCTAs(text: string): {
  hooks: string[];
  callToActions: string[];
} {
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
  const hooks: string[] = [];
  const callToActions: string[] = [];

  sentences.forEach(sentence => {
    // Check for hooks
    if (isHook(sentence)) {
      hooks.push(sentence);
    }
    
    // Check for CTAs
    if (isCTA(sentence)) {
      callToActions.push(sentence);
    }
  });

  return {
    hooks: hooks.slice(0, 5), // Limit to top 5 hooks
    callToActions: callToActions.slice(0, 3) // Limit to top 3 CTAs
  };
}

/**
 * Analyzes overall engagement potential of content
 */
export function analyzeEngagement(
  text: string,
  hooks: string[],
  callToActions: string[]
): number {
  let score = 70; // Base score
  
  // Analyze hook presence and quality
  if (hooks.length === 0) {
    score -= 20;
  } else {
    score += Math.min(hooks.length * 5, 15);
  }
  
  // Analyze CTA presence and quality
  if (callToActions.length === 0) {
    score -= 15;
  } else {
    score += Math.min(callToActions.length * 5, 10);
  }
  
  // Check content structure
  const paragraphs = text.split('\n').filter(p => p.trim().length > 0);
  if (paragraphs.length < 3) {
    score -= 10;
  }
  
  // Check for interactive elements
  if (hasInteractiveElements(text)) {
    score += 10;
  }
  
  // Check for emotional triggers
  const emotionalScore = analyzeEmotionalAppeal(text);
  score += emotionalScore;
  
  return Math.min(100, Math.max(0, score));
}

/**
 * Checks if a sentence is an engagement hook
 */
function isHook(sentence: string): boolean {
  const hookPatterns = [
    /^(did you know|have you ever|imagine|picture this|what if)/i,
    /\?$/,
    /(fascinating|incredible|surprising|amazing|shocking)/i,
    /^(discover|learn|find out|uncover|reveal)/i,
    /^(the secret|the truth|the real reason)/i
  ];

  return hookPatterns.some(pattern => pattern.test(sentence));
}

/**
 * Checks if a sentence is a call-to-action
 */
function isCTA(sentence: string): boolean {
  const ctaPatterns = [
    /(click|subscribe|sign up|register|download|get started|learn more|contact us)/i,
    /^(start|begin|try|get|download|subscribe|sign up)/i,
    /(today|now|immediately|instantly)$/i,
    /^(don't wait|don't miss)/i,
    /(call|email|visit|check out)/i
  ];

  return ctaPatterns.some(pattern => pattern.test(sentence));
}

/**
 * Checks for presence of interactive elements in content
 */
function hasInteractiveElements(text: string): boolean {
  const interactivePatterns = [
    /(click|tap|swipe|scroll)/i,
    /(form|quiz|survey|poll)/i,
    /(watch|play|listen)/i,
    /(share|comment|like|follow)/i
  ];

  return interactivePatterns.some(pattern => pattern.test(text));
}

/**
 * Analyzes emotional appeal of content
 */
function analyzeEmotionalAppeal(text: string): number {
  const emotionalWords = [
    // Positive emotions
    /(happy|joy|excited|amazing|wonderful|fantastic|great|excellent)/i,
    // Trust and safety
    /(trusted|secure|safe|reliable|proven|guaranteed)/i,
    // Urgency and exclusivity
    /(exclusive|limited|special|unique|rare|only)/i,
    // Problem-solving
    /(solution|solve|fix|improve|enhance|optimize)/i,
    // Personal benefit
    /(benefit|advantage|gain|profit|earn|save)/i
  ];

  const emotionalCount = emotionalWords.filter(pattern => 
    pattern.test(text)
  ).length;

  return Math.min(emotionalCount * 2, 10);
}

// Types for engagement metrics
export interface EngagementMetrics {
  likes: number;
  comments: number;
  shares: number;
  views: number;
  totalInteractions: number;
  engagementRate: number;
}

/**
 * Generates mock engagement metrics for testing and development
 * @returns {EngagementMetrics} Mock engagement data
 */
export function getMockEngagementMetrics(): EngagementMetrics {
  // Generate random numbers within realistic ranges
  const views = Math.floor(Math.random() * 10000) + 1000;
  const likes = Math.floor(Math.random() * (views * 0.2)); // Up to 20% of views
  const comments = Math.floor(Math.random() * (likes * 0.3)); // Up to 30% of likes
  const shares = Math.floor(Math.random() * (likes * 0.15)); // Up to 15% of likes
  
  const totalInteractions = likes + comments + shares;
  const engagementRate = Number(((totalInteractions / views) * 100).toFixed(2));

  return {
    likes,
    comments,
    shares,
    views,
    totalInteractions,
    engagementRate
  };
}

/**
 * Analyzes engagement metrics and provides insights
 * @param {EngagementMetrics} metrics The engagement metrics to analyze
 * @returns {string[]} Array of insights based on the metrics
 */
export function analyzeMetrics(metrics: EngagementMetrics): string[] {
  const insights: string[] = [];
  
  if (metrics.engagementRate > 5) {
    insights.push("High engagement rate - content is resonating well with audience");
  } else if (metrics.engagementRate < 2) {
    insights.push("Low engagement rate - consider ways to make content more engaging");
  }

  if (metrics.comments / metrics.views > 0.05) {
    insights.push("Strong comment ratio indicates highly discussable content");
  }

  if (metrics.shares / metrics.likes > 0.3) {
    insights.push("Content has good viral potential with high share-to-like ratio");
  }

  return insights;
} 