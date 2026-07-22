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
          <nav className="sticky top-0 z-50 flex items-center gap-6 px-6 py-3 border-b border-[#E4DFD3] bg-[#FAF8F2]/90 backdrop-blur-md text-sm font-medium">
            <Link href="/" className="text-[#1D1B18] font-semibold tracking-tight mr-4">
              Post Drive
            </Link>
            <Link href="/connect" className="text-[#6B6459] hover:text-[#1D1B18] transition-colors">
              Connect
            </Link>
            <Link href="/post" className="text-[#6B6459] hover:text-[#1D1B18] transition-colors">
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
