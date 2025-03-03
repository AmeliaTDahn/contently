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
      overall: 91
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
        text: "analytics",
        count: 5
      }
    ],
    keywordAnalysis: {
      distribution: "Well-balanced keyword distribution across the content",
      overused: ["content strategy"],
      underused: ["marketing ROI", "content metrics"]
    }
  },
  stats: {
    wordCountStats: {
      count: 5454,
      min: 0.0,
      max: 6621.0,
      avg: 608.0913091309131,
      sum: 3316530.0
    },
    articlesPerMonth: [
      {
        date: "2024-03-01T00:00:00.000Z",
        count: 8
      },
      {
        date: "2024-02-01T00:00:00.000Z",
        count: 2
      },
      {
        date: "2024-01-01T00:00:00.000Z",
        count: 1
      }
    ]
  },
  articles: {
    total: 1,
    articles: [
      {
        id: "2247569",
        wordCount: 49,
        keywords: [
          "J.R.R. Tolkien",
          "All that glitters is not gold"
        ],
        createdAt: "2024-01-07T06:04:57.477-05:00",
        title: "Not all those who wander are lost - J.R.R. Tolkien",
        url: "https://contently.com/danette"
      }
    ],
    urlPatterns: []
  }
}; 