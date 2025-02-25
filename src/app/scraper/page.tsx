import Navbar from "@/components/Navbar";
import ScraperTool from "@/components/ScraperTool";

export const metadata = {
  title: "Web Scraper | Contently",
  description: "Advanced web scraping tool to extract content from websites",
};

export default function ScraperPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl bg-gradient-to-r from-teal-600 to-blue-500 bg-clip-text text-transparent">
              Web Scraper
            </h1>
            <p className="mt-3 text-xl text-gray-600 sm:mt-4 max-w-2xl mx-auto">
              Extract content from any website with our advanced scraping tools
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
            <ScraperTool />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-teal-50 rounded-lg p-6 border border-teal-100">
              <div className="text-teal-600 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Static HTML Scraping</h3>
              <p className="mt-2 text-gray-600">Extract content from static websites using Cheerio's fast and efficient parsing.</p>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
              <div className="text-blue-600 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Dynamic Content Scraping</h3>
              <p className="mt-2 text-gray-600">Capture JavaScript-rendered content with Puppeteer's headless browser technology.</p>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-6 border border-purple-100">
              <div className="text-purple-600 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Structured Data Extraction</h3>
              <p className="mt-2 text-gray-600">Extract JSON-LD, tables, forms, and other structured data from web pages.</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
} 