import Navbar from "@/components/Navbar";
import { ScraperTool } from "@/components/ScraperTool";

export const metadata = {
  title: "URLs | Contently",
  description: "Extract and analyze content and metadata from any URL.",
};

export default function UrlsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">URLs</h1>
          <p className="text-xl text-gray-600">
            Extract content and metadata from any URL to analyze and improve your content.
          </p>
        </div>
        <ScraperTool />
      </main>
    </div>
  );
} 