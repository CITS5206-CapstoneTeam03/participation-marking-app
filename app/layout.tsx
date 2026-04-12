import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "./context/app-context";

export const metadata: Metadata = {
  title: "UWA Participation Marking System",
  description: "Participation marking workflow and configuration system.",
  // Open Graph
  openGraph: {
    title: "UWA Participation Marking System",
    description: "Participation marking workflow and configuration system.",
    url: "https://partimark.app/",
    siteName: "Partimark",
    images: [
      {
        url: "https://partimark.app/UWA-Banner-Logo.png",
        width: 1200,
        height: 630,
        alt: "UWA System Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  // X/Twitter
  twitter: {
    card: "summary_large_image",
    title: "UWA Participation Marking System",
    description: "Participation marking workflow and configuration system.",
    images: ["https://partimark.app/UWA-Banner-Logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
