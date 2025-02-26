import Navbar from "@/components/Navbar";
import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-16">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-teal-500 to-teal-700 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between">
              <div className="md:w-1/2 mb-10 md:mb-0">
                <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                  Streamline Your Content Planning with Contently
                </h1>
                <p className="text-xl mb-8 text-teal-100">
                  Organize, schedule, and optimize your content strategy with our AI-powered calendar and analytics tools.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link 
                    href="/calendar" 
                    className="bg-white text-teal-700 px-6 py-3 rounded-md font-medium hover:bg-teal-50 transition-colors shadow-md"
                  >
                    Open Calendar
                  </Link>
                  <Link 
                    href="/signup" 
                    className="bg-teal-800 text-white px-6 py-3 rounded-md font-medium hover:bg-teal-900 transition-colors border border-teal-600"
                  >
                    Get Started
                  </Link>
                </div>
              </div>
              <div className="md:w-1/2">
                <div className="bg-white p-2 rounded-lg shadow-xl overflow-hidden">
                  <div className="relative h-64 w-full">
                    <Image 
                      src="https://images.unsplash.com/photo-1611926653458-09294b3142bf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
                      alt="Vibrant digital content calendar with planning elements" 
                      fill
                      style={{ objectFit: 'cover' }}
                      className="rounded-md"
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Key Features</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="bg-teal-100 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800">AI Calendar Generator</h3>
                <p className="text-gray-600">Generate optimized content calendars from your existing content or let our AI suggest the best publishing schedule.</p>
              </div>
              
              {/* Feature 2 */}
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="bg-teal-100 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800">Content Analytics</h3>
                <p className="text-gray-600">Track performance metrics and get insights to optimize your content strategy for better engagement and conversion.</p>
              </div>
              
              {/* Feature 3 */}
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="bg-teal-100 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800">URL Analysis</h3>
                <p className="text-gray-600">Automatically extract and analyze content from your websites and competitors to inform your content strategy.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gray-100 py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-6 text-gray-800">Ready to Transform Your Content Strategy?</h2>
            <p className="text-xl mb-8 text-gray-600 max-w-3xl mx-auto">
              Join thousands of content creators and marketing teams who use Contently to streamline their workflow and boost engagement.
            </p>
            <Link 
              href="/calendar" 
              className="bg-teal-600 text-white px-8 py-4 rounded-md font-medium hover:bg-teal-700 transition-colors shadow-md inline-block"
            >
              Try the Calendar Now
            </Link>
          </div>
        </section>
      </main>
      
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Contently</h3>
              <p className="text-gray-300">
                AI-powered content planning and analytics for modern marketing teams.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2">
                <li><Link href="/calendar" className="text-gray-300 hover:text-white">Calendar</Link></li>
                <li><Link href="/analytics" className="text-gray-300 hover:text-white">Analytics</Link></li>
                <li><Link href="/urls" className="text-gray-300 hover:text-white">URLs</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-gray-300 hover:text-white">About Us</Link></li>
                <li><Link href="/contact" className="text-gray-300 hover:text-white">Contact</Link></li>
                <li><Link href="/careers" className="text-gray-300 hover:text-white">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-gray-300 hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-gray-300 hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8">
            <p className="text-center text-gray-400">
              © {new Date().getFullYear()} Contently. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
