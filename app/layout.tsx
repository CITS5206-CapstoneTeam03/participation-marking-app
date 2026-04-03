import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UWA Participation Marking App",
  description: "Frontend prototype for marking workflow and unit configuration.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
