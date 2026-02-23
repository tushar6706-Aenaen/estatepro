import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/src/components/ui/toast-provider";
import { ComparisonProvider } from "@/src/components/comparison-provider";
import { MobileNavigation } from "@/src/components/mobile-navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "LuxEstate - Find Your Dream Home",
    template: "%s | LuxEstate",
  },
  description:
    "Discover luxury properties in exclusive locations. Browse premium real estate listings with advanced search, property comparison, and direct agent communication.",
  keywords: [
    "real estate",
    "luxury homes",
    "property listings",
    "buy house",
    "rent apartment",
    "real estate agent",
  ],
  authors: [{ name: "LuxEstate" }],
  creator: "LuxEstate",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "LuxEstate - Find Your Dream Home",
    description: "Discover luxury properties in exclusive locations",
    siteName: "LuxEstate",
  },
  twitter: {
    card: "summary_large_image",
    title: "LuxEstate - Find Your Dream Home",
    description: "Discover luxury properties in exclusive locations",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ToastProvider>
          <ComparisonProvider>
            {children}
            <Suspense fallback={null}>
              <MobileNavigation />
            </Suspense>
          </ComparisonProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
