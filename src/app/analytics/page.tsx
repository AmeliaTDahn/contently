import Navbar from "@/components/Navbar";
import { ContentAnalytics } from "@/components/ContentAnalytics";

export const metadata = {
  title: "Content Analytics | Contently",
  description: "Analyze your content quality, readability, and engagement metrics.",
};

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Content Analytics</h1>
          <p className="text-xl text-gray-600">
            Analyze your content to improve quality, readability, and engagement.
          </p>
        </div>
        <ContentAnalytics />
      </main>
    </div>
  );
} 