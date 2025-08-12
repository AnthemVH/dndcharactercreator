import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SessionProviderWrapper from './SessionProviderWrapper';
import FantasyNotification from '@/components/FantasyNotification';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "D&D Master Tools",
  description: "Comprehensive D&D tools for character creation, world building, and campaign management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProviderWrapper>
          <div className="min-h-screen bg-gray-50">
            {children}
          </div>
          <FantasyNotification />
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
