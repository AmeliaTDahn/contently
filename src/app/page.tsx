import Navbar from "@/components/Navbar";
import UrlCalendarGenerator from "@/components/UrlCalendarGenerator";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl bg-gradient-to-r from-teal-600 to-blue-500 bg-clip-text text-transparent">
              Contently
            </h1>
            <p className="mt-3 text-xl text-gray-600 sm:mt-4 max-w-2xl mx-auto">
              Generate AI-powered content calendars from your favorite websites
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
            <UrlCalendarGenerator />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-teal-50 rounded-lg p-6 border border-teal-100">
              <div className="text-teal-600 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Content Aggregation</h3>
              <p className="mt-2 text-gray-600">Collect content from multiple sources in one place for easy planning.</p>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
              <div className="text-blue-600 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Calendar View</h3>
              <p className="mt-2 text-gray-600">Visualize your content schedule with an intuitive calendar interface.</p>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-6 border border-purple-100">
              <div className="text-purple-600 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">AI-Powered</h3>
              <p className="mt-2 text-gray-600">Let our AI analyze content and suggest optimal publishing schedules.</p>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="bg-gray-50 border-t border-gray-100 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} Contently. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
}
