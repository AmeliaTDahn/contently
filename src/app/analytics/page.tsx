import Navbar from "@/components/Navbar";
import ContentAnalytics from "@/components/ContentAnalytics";

export const metadata = {
  title: "Content Analytics | Contently",
  description: "Analyze content quality, readability, and engagement metrics",
};

export default function AnalyticsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl bg-gradient-to-r from-teal-600 to-blue-500 bg-clip-text text-transparent">
              Content Analytics
            </h1>
            <p className="mt-3 text-xl text-gray-600 sm:mt-4 max-w-2xl mx-auto">
              Get detailed insights into your content quality, readability, and engagement metrics
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
            <ContentAnalytics />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-teal-50 rounded-lg p-6 border border-teal-100">
              <div className="text-teal-600 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Content Quality</h3>
              <p className="mt-2 text-gray-600">Analyze readability, structure, and overall content quality metrics.</p>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
              <div className="text-blue-600 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">SEO Analysis</h3>
              <p className="mt-2 text-gray-600">Get insights into keyword usage, meta tags, and SEO optimization.</p>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-6 border border-purple-100">
              <div className="text-purple-600 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Engagement Metrics</h3>
              <p className="mt-2 text-gray-600">Evaluate engagement potential with hook and CTA analysis.</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
} 