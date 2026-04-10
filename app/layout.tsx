import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UWA Participation Marking System",
  description: "Participation marking workflow and configuration system.",
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
