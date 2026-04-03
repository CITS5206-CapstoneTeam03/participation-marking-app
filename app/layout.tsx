import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UWA Participation Marking System",
  description: "Participation marking workflow and configuration prototype.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
      <body>{children}</body>
    </html>
  );
}
