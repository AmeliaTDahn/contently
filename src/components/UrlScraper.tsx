"use client";

import { useState } from "react";
import Image from 'next/image';
import type { ScrapedContent } from '@/utils/scrapers';

interface ApiResponse {
  error?: { message: string };
  content?: ScrapedContent;
}

interface UrlScraperProps {
  onAnalyze?: (url: string) => Promise<void>;
}

export const UrlScraper: React.FC<UrlScraperProps> = ({ onAnalyze }) => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scrapedContent, setScrapedContent] = useState<ScrapedContent | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      setError("Please enter a URL");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json() as ApiResponse;

      if (!response.ok) {
        throw new Error(data.error?.message ?? 'Failed to scrape content');
      }

      if (!data.content) {
        throw new Error('No content received from the server');
      }

      setScrapedContent(data.content);
      if (onAnalyze) {
        await onAnalyze(url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setScrapedContent(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-4">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter URL to scrape"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2 rounded-md font-medium ${
              loading
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-teal-600 text-white hover:bg-teal-700'
            }`}
          >
            {loading ? 'Scraping...' : 'Scrape'}
          </button>
        </div>
      </form>

      {error && (
        <div className="text-red-500 mb-4">{error}</div>
      )}

      {scrapedContent && (
        <div className="space-y-8">
          <section className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Metadata</h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="font-medium text-gray-500">Title</dt>
                <dd className="mt-1">{scrapedContent.metadata.title}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Description</dt>
                <dd className="mt-1">{scrapedContent.metadata.description}</dd>
              </div>
              {scrapedContent.metadata.keywords.length > 0 && (
                <div className="col-span-2">
                  <dt className="font-medium text-gray-500">Keywords</dt>
                  <dd className="mt-1 flex flex-wrap gap-2">
                    {scrapedContent.metadata.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 rounded-md text-sm"
                      >
                        {keyword}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </section>

          {scrapedContent.headings.headings.length > 0 && (
            <section className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold mb-4">Headings</h2>
              <div className="space-y-2">
                {scrapedContent.headings.headings.map((heading, index) => (
                  <div
                    key={index}
                    className={`pl-${index < scrapedContent.headings.h1Tags.length ? 4 : 8} ${
                      index < scrapedContent.headings.h1Tags.length ? 'text-xl font-medium' : 'text-lg font-medium'
                    }`}
                  >
                    {heading}
                  </div>
                ))}
              </div>
            </section>
          )}

          {scrapedContent.images.length > 0 && (
            <section className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold mb-4">Images</h2>
              <div className="grid grid-cols-2 gap-4">
                {scrapedContent.images.map((image, index) => (
                  <div key={index} className="relative">
                    <Image
                      src={image.src}
                      alt={image.alt}
                      width={400}
                      height={300}
                      className="rounded-lg"
                    />
                    {image.alt && (
                      <p className="mt-2 text-sm text-gray-500">{image.alt}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {scrapedContent.links.length > 0 && (
            <section className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold mb-4">Links</h2>
              <ul className="space-y-2">
                {scrapedContent.links.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-600 hover:text-teal-700"
                    >
                      {link.text || link.href}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}; 