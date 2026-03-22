import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import Providers from "@/components/providers/Providers";
import AppLayout from "@/components/layout/AppLayout";

// Use locally bundled Geist fonts to avoid network dependency during build
const geistSans = localFont({
  src: "../../node_modules/next/dist/compiled/@vercel/og/Geist-Regular.ttf",
  variable: "--font-geist-sans",
});

const geistMono = localFont({
  src: "../../node_modules/next/dist/compiled/@vercel/og/Geist-Regular.ttf",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "KP作文宝",
  description: "AI写作教练，助力PET备考",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let userEmail: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userEmail = user?.email ?? null;
  } catch {
    // Supabase not configured yet - ignore
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-50">
        <Providers>
          <AppLayout userEmail={userEmail}>{children}</AppLayout>
        </Providers>
      </body>
    </html>
  );
}
