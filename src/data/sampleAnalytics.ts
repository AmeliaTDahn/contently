import { ExtendedAnalytics } from '../types/analytics';

export const sampleAnalytics: ExtendedAnalytics = {
  currentArticle: {
    engagementScore: 85,
    contentQualityScore: 92,
    readabilityScore: 88,
    seoScore: 90,
    insights: {
      engagement: [
        "Strong social media sharing potential",
        "High reader retention rate",
        "Effective call-to-action placement",
        "Good comment engagement probability"
      ],
      content: [
        "Well-structured content with clear sections",
        "Effective use of examples and case studies",
        "Balanced mix of technical and accessible language",
        "Strong supporting evidence for claims"
      ],
      readability: [
        "Appropriate sentence length variation",
        "Clear paragraph structure",
        "Good use of subheadings",
        "Effective use of bullet points and lists"
      ],
      seo: [
        "Strong keyword optimization",
        "Well-structured meta description",
        "Effective use of header tags",
        "Good internal linking structure"
      ]
    },
    industry: "Digital Marketing",
    scope: "Comprehensive",
    topics: [
      "Content Strategy",
      "Digital Marketing",
      "SEO Optimization",
      "Content Writing"
    ],
    writingQuality: {
      grammar: 95,
      clarity: 90,
      structure: 88,
      vocabulary: 92,
      overall: 91,
      explanations: {
        grammar: "Excellent grammar usage throughout",
        clarity: "Very clear and concise writing",
        structure: "Well-organized content structure",
        vocabulary: "Professional and appropriate vocabulary",
        overall: "High-quality writing overall"
      }
    },
    audienceLevel: "Intermediate",
    contentType: "Blog Post",
    tone: "Professional",
    estimatedReadTime: 8,
    keywords: [
      {
        text: "content strategy",
        count: 12
      },
      {
        text: "digital marketing",
        count: 8
      },
      {
        text: "SEO",
        count: 6
      },
      {
        text: "content writing",
        count: 5
      }
    ],
    keywordAnalysis: {
      distribution: "Well-balanced",
      overused: [],
      underused: ["marketing automation", "content calendar"],
      explanation: "Good keyword distribution with room for additional terms"
    },
    engagement: {
      likes: 245,
      comments: 32,
      shares: 128,
      bookmarks: 56,
      totalViews: 3500,
      uniqueViews: 2800,
      avgTimeOnPage: 4.5,
      bounceRate: 25,
      socialShares: {
        facebook: 85,
        twitter: 120,
        linkedin: 95,
        pinterest: 15
      },
      explanations: {
        likes: "Strong engagement through likes",
        comments: "Active discussion in comments",
        shares: "Good social sharing activity",
        bookmarks: "Content worth saving for later",
        totalViews: "High overall viewership",
        uniqueViews: "Strong unique visitor count",
        avgTimeOnPage: "Good time spent reading",
        bounceRate: "Low bounce rate indicates engagement",
        socialShares: "Well-distributed social sharing"
      }
    }
  },
  stats: {
    wordCountStats: {
      count: 1500,
      min: 1200,
      max: 1800,
      avg: 1500,
      sum: 15000,
      explanations: {
        count: "Total word count analysis",
        min: "Minimum word count analysis",
        max: "Maximum word count analysis",
        avg: "Average word count analysis",
        sum: "Total words across all articles"
      }
    },
    articlesPerMonth: [
      {
        date: "2024-01",
        count: 4,
        explanation: "January 2024 article count"
      },
      {
        date: "2024-02",
        count: 5,
        explanation: "February 2024 article count"
      },
      {
        date: "2024-03",
        count: 6,
        explanation: "March 2024 article count"
      }
    ]
  }
}; 