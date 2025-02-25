"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only run redirects when not in loading state
    if (!loading) {
      // If no user and not on auth pages, redirect to signin
      if (!user && !pathname.includes("/signin") && !pathname.includes("/signup")) {
        router.push("/signin");
      }
      
      // If on auth pages and logged in, redirect to home
      if (user && (pathname === "/signin" || pathname === "/signup")) {
        router.push("/");
      }
    }
  }, [user, loading, router, pathname]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-indigo-600"></div>
      </div>
    );
  }

  // If on auth pages and logged in, show loading until redirect happens
  if (user && (pathname === "/signin" || pathname === "/signup")) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-indigo-600"></div>
      </div>
    );
  }

  // If not on auth pages and not logged in, component will redirect in the useEffect
  // If on auth pages and not logged in, show the auth pages
  // If logged in and not on auth pages, show the protected content
  return <>{children}</>;
} 