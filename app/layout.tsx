import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "ReScrape",
  description: "Budget-controlled source discovery admin tool"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
