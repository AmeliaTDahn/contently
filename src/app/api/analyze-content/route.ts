import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { calculateReadingLevel, analyzeReadability } from '@/utils/readability';
import { extractKeywords, calculateKeywordDensity } from '@/utils/keywords';
import { analyzeTopicCoherence, extractMainTopics } from '@/utils/topics';
import { analyzeEngagement, findHooksAndCTAs } from '@/utils/engagement';
import { getMockEngagementMetrics, analyzeMetrics } from '@/utils/engagement';

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Fetch the content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch content' }, { status: response.status });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract basic content
    const title = $('title').text().trim();
    const metaDescription = $('meta[name="description"]').attr('content') || '';
    const mainContent = $('article, .post-content, .entry-content, main, .content').text().trim();
    const paragraphs = mainContent.split('\n').filter(p => p.trim().length > 0);
    
    // Basic content metrics
    const wordCount = mainContent.split(/\s+/).length;
    const sentences = mainContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const averageSentenceLength = wordCount / sentences.length;

    // Analyze readability
    const readabilityScore = analyzeReadability(mainContent);
    const readingLevel = calculateReadingLevel(mainContent);

    // Extract and analyze keywords
    const keywords = extractKeywords(mainContent);
    const keywordDensity = calculateKeywordDensity(mainContent, keywords);

    // Topic analysis
    const mainTopics = extractMainTopics(mainContent);
    const topicCoherence = analyzeTopicCoherence(mainContent, title);
    const titleTopicAlignment = analyzeTitleTopicAlignment(title, mainTopics);

    // Engagement analysis
    const { hooks, callToActions } = findHooksAndCTAs(mainContent);
    const engagementScore = analyzeEngagement(mainContent, hooks, callToActions);
    const mockMetrics = getMockEngagementMetrics();
    const engagementInsights = analyzeMetrics(mockMetrics);

    // Content quality analysis
    const contentQualityScore = analyzeContentQuality(mainContent, title, metaDescription);
    const { strengths, improvements } = analyzeStrengthsAndWeaknesses(mainContent, title, metaDescription);

    // Compile the analysis results
    const analysisResult = {
      readability: {
        score: readabilityScore,
        level: readingLevel,
        analysis: generateReadabilityAnalysis(readabilityScore, readingLevel),
      },
      seoAnalysis: {
        titleScore: analyzeTitleSEO(title),
        titleAnalysis: generateTitleAnalysis(title),
        keywordDensity,
        metaDescription: {
          score: analyzeMetaDescription(metaDescription),
          analysis: generateMetaDescriptionAnalysis(metaDescription),
        },
      },
      contentQuality: {
        score: contentQualityScore,
        strengths,
        improvements,
        wordCount,
        averageSentenceLength,
        paragraphCount: paragraphs.length,
      },
      topicAnalysis: {
        score: calculateTopicScore(topicCoherence, titleTopicAlignment),
        mainTopics,
        coherence: topicCoherence,
        titleTopicAlignment,
      },
      engagement: {
        score: engagementScore,
        analysis: generateEngagementAnalysis(engagementScore, hooks, callToActions),
        hooks,
        callToActions,
        metrics: mockMetrics,
        insights: engagementInsights,
      },
    };

    return NextResponse.json(analysisResult);
  } catch (error) {
    console.error('Error analyzing content:', error);
    return NextResponse.json(
      { error: 'Failed to analyze content' },
      { status: 500 }
    );
  }
}

// Helper functions for analysis

function analyzeTitleSEO(title: string): number {
  const score = 100;
  const deductions = [];

  if (!title) deductions.push(100);
  if (title.length < 30) deductions.push(20);
  if (title.length > 60) deductions.push(20);
  if (!/[a-zA-Z0-9]/.test(title)) deductions.push(30);
  if (title.toLowerCase() === title) deductions.push(10);

  return Math.max(0, score - deductions.reduce((a, b) => a + b, 0));
}

function analyzeMetaDescription(description: string): number {
  const score = 100;
  const deductions = [];

  if (!description) deductions.push(100);
  if (description.length < 120) deductions.push(20);
  if (description.length > 160) deductions.push(20);
  if (!/[a-zA-Z0-9]/.test(description)) deductions.push(30);

  return Math.max(0, score - deductions.reduce((a, b) => a + b, 0));
}

function analyzeContentQuality(content: string, title: string, metaDescription: string): number {
  const score = 100;
  const deductions = [];

  if (content.length < 300) deductions.push(30);
  if (!title) deductions.push(20);
  if (!metaDescription) deductions.push(10);
  if (content.split('\n').filter(p => p.trim().length > 0).length < 3) deductions.push(20);
  if (content.split(/[.!?]+/).filter(s => s.trim().length > 0).length < 5) deductions.push(20);

  return Math.max(0, score - deductions.reduce((a, b) => a + b, 0));
}

function analyzeTitleTopicAlignment(title: string, mainTopics: string[]): string {
  const titleWords = new Set(title.toLowerCase().split(/\W+/));
  const topicOverlap = mainTopics.filter(topic => 
    topic.toLowerCase().split(/\W+/).some(word => titleWords.has(word))
  ).length;

  if (topicOverlap === 0) {
    return "The title doesn't clearly reflect the main topics discussed in the content.";
  } else if (topicOverlap < mainTopics.length / 2) {
    return "The title partially aligns with the content topics, but could be more specific.";
  } else {
    return "The title effectively represents the main topics discussed in the content.";
  }
}

function calculateTopicScore(coherence: string, alignment: string): number {
  let score = 100;

  if (coherence.includes("lacks")) score -= 30;
  if (coherence.includes("could be improved")) score -= 15;
  if (alignment.includes("doesn't clearly reflect")) score -= 30;
  if (alignment.includes("partially aligns")) score -= 15;

  return Math.max(0, score);
}

function analyzeStrengthsAndWeaknesses(content: string, title: string, metaDescription: string) {
  const strengths: string[] = [];
  const improvements: string[] = [];

  // Analyze content length
  if (content.length > 1000) {
    strengths.push("Comprehensive content length");
  } else {
    improvements.push("Consider expanding the content for more depth");
  }

  // Analyze paragraph structure
  const paragraphs = content.split('\n').filter(p => p.trim().length > 0);
  if (paragraphs.length >= 5) {
    strengths.push("Well-structured with multiple paragraphs");
  } else {
    improvements.push("Add more paragraphs to improve readability");
  }

  // Analyze title
  if (title && title.length >= 30 && title.length <= 60) {
    strengths.push("Optimal title length for SEO");
  } else {
    improvements.push("Adjust title length (30-60 characters) for better SEO");
  }

  // Analyze meta description
  if (metaDescription && metaDescription.length >= 120 && metaDescription.length <= 160) {
    strengths.push("Well-optimized meta description");
  } else {
    improvements.push("Optimize meta description length (120-160 characters)");
  }

  // Analyze sentence variety
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
  if (sentences.some(s => s.length < avgLength * 0.5) && sentences.some(s => s.length > avgLength * 1.5)) {
    strengths.push("Good variety in sentence length");
  } else {
    improvements.push("Vary sentence lengths for better engagement");
  }

  return { strengths, improvements };
}

function generateReadabilityAnalysis(score: number, level: string): string {
  if (score >= 80) {
    return `The content is highly readable at a ${level} level, making it accessible to a broad audience.`;
  } else if (score >= 60) {
    return `The content has moderate readability at a ${level} level. Consider simplifying some passages.`;
  } else {
    return `The content may be difficult to read at a ${level} level. Consider breaking down complex sentences and using simpler language.`;
  }
}

function generateTitleAnalysis(title: string): string {
  if (!title) return "Missing title - this is crucial for SEO and user engagement.";
  
  const issues = [];
  if (title.length < 30) issues.push("too short");
  if (title.length > 60) issues.push("too long");
  if (title.toLowerCase() === title) issues.push("lacks proper capitalization");
  
  if (issues.length === 0) {
    return "Well-optimized title with good length and formatting.";
  } else {
    return `Title could be improved: ${issues.join(", ")}.`;
  }
}

function generateMetaDescriptionAnalysis(description: string): string {
  if (!description) return "Missing meta description - this is important for SEO and click-through rates.";
  
  const issues = [];
  if (description.length < 120) issues.push("too short");
  if (description.length > 160) issues.push("too long");
  
  if (issues.length === 0) {
    return "Well-optimized meta description with ideal length.";
  } else {
    return `Meta description could be improved: ${issues.join(", ")}.`;
  }
}

function generateEngagementAnalysis(score: number, hooks: string[], ctas: string[]): string {
  if (score >= 80) {
    return `Strong engagement potential with ${hooks.length} effective hooks and ${ctas.length} clear calls-to-action.`;
  } else if (score >= 60) {
    return `Moderate engagement with some effective elements. Consider adding more hooks or strengthening calls-to-action.`;
  } else {
    return `Limited engagement potential. Recommend adding more engaging elements and clear calls-to-action.`;
  }
} 