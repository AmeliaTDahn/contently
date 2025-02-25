"use client";

import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="bg-white border-b border-gray-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <Link href="/" className="text-xl font-bold text-teal-600">
                Contently
              </Link>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              <Link
                href="/"
                className="inline-flex items-center border-b-2 border-teal-500 px-1 pt-1 text-sm font-medium text-gray-900"
              >
                Home
              </Link>
              <Link
                href="/scraper"
                className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
              >
                Scraper
              </Link>
              <Link
                href="/"
                className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
              >
                Calendar
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center">
                  <span className="text-teal-800 font-medium">
                    {user.email?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
                <span className="text-sm text-gray-700">{user.email}</span>
                <button
                  onClick={() => signOut()}
                  className="rounded-md bg-white px-3 py-2 text-sm font-medium text-teal-600 hover:bg-teal-50 border border-teal-200"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/signin"
                  className="rounded-md bg-white px-3 py-2 text-sm font-medium text-teal-600 hover:bg-teal-50 border border-teal-200"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-md bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-500"
              aria-controls="mobile-menu"
              aria-expanded={mobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {/* Icon when menu is closed */}
              <svg
                className={`${mobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              {/* Icon when menu is open */}
              <svg
                className={`${mobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      <div className={`${mobileMenuOpen ? 'block' : 'hidden'} sm:hidden`} id="mobile-menu">
        <div className="space-y-1 pt-2 pb-3">
          <Link
            href="/"
            className="block border-l-4 border-teal-500 bg-teal-50 py-2 pl-3 pr-4 text-base font-medium text-teal-700"
          >
            Home
          </Link>
          <Link
            href="/scraper"
            className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
          >
            Scraper
          </Link>
          <Link
            href="/"
            className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
          >
            Calendar
          </Link>
        </div>
        <div className="border-t border-gray-200 pt-4 pb-3">
          {user ? (
            <div className="flex flex-col px-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                    <span className="text-teal-800 font-medium">
                      {user.email?.charAt(0).toUpperCase() || "U"}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">
                    {user.email}
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <button
                  onClick={() => signOut()}
                  className="block w-full rounded-md bg-teal-50 px-3 py-2 text-base font-medium text-teal-700 hover:bg-teal-100"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col space-y-2 px-4">
              <Link
                href="/signin"
                className="block rounded-md bg-white px-3 py-2 text-base font-medium text-teal-600 hover:bg-teal-50 border border-teal-200 text-center"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="block rounded-md bg-teal-600 px-3 py-2 text-base font-medium text-white hover:bg-teal-700 text-center"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
} 