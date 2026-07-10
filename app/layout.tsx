import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import NavAccountStatus from "@/components/nav-account-status";
import { AuthProvider } from "@/components/auth-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Post Drive",
  description: "AI-powered content for Threads",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <nav className="flex items-center gap-6 px-6 py-3 border-b border-gray-200 text-sm font-medium">
            <Link href="/" className="text-gray-900 hover:text-gray-600 transition-colors">
              Home
            </Link>
            <Link href="/connect" className="text-gray-900 hover:text-gray-600 transition-colors">
              Connect
            </Link>
            <Link href="/post" className="text-gray-900 hover:text-gray-600 transition-colors">
              Post
            </Link>
            <NavAccountStatus />
          </nav>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
