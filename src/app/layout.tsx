import "@/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { AuthProvider } from "@/lib/auth-context";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata: Metadata = {
  title: "Create T3 App",
  description: "Generated by create-t3-app",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body>
        <AuthProvider>
          <ProtectedRoute>{children}</ProtectedRoute>
        </AuthProvider>
      </body>
    </html>
  );
}
