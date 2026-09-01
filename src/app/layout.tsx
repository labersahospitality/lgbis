import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LGBIS - Labersa Group Business Intelligence",
  description: "Dashboard Management Intelligence untuk Labersa Group",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
