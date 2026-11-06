import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ToastProvider } from "@/components/ui/Toast";
import { ThemeProvider } from "@/components/ThemeProvider";
import NativeApp from "@/components/NativeApp";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    default: "ThoughtDrop",
    template: "%s",
  },
  description: "Share and discover brilliant ideas.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/favicon-192.png",
  },
  openGraph: {
    title: "ThoughtDrop",
    description: "Share and discover brilliant ideas.",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ThoughtDrop Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ThoughtDrop",
    description: "Share and discover brilliant ideas.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <html lang="en" className="dark">
        <body
          className={`${inter.variable} font-sans antialiased bg-background text-foreground`}
        >
          <Navbar />
          <NativeApp />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
            <ToastProvider>{children}</ToastProvider>
          </main>
        </body>
      </html>
    </ThemeProvider>
  );
}
