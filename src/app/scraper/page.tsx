import Navbar from "@/components/Navbar";
import UrlScraper from "@/components/UrlScraper";

export default function ScraperPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Content Scraper
            </h1>
            <p className="mt-3 text-xl text-gray-600 max-w-2xl mx-auto">
              Extract content from URLs to analyze and optimize your content strategy
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <UrlScraper />
          </div>
        </div>
      </main>
    </>
  );
} 