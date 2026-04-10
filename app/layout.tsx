import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "./context/app-context";

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
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
