import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/Providers";
import { ConditionalNav } from "@/components/ConditionalNav";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import "./globals.css";

export const dynamic = 'force-dynamic';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "VirtuFit — Virtual try-on API",
  description: "Virtual try-on API. Sign up, manage credits, and integrate try-on into your app.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  let navCredits = 0;
  if (session) {
    const u = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { credits: true },
    });
    navCredits = u?.credits ?? 0;
  }

  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased bg-[#1A1915] text-[#F0EFE8]`}
        style={
          {
            "--font-serif-anthropic": "Georgia, Times New Roman, serif",
          } as React.CSSProperties
        }
      >
        <Providers>
          <ConditionalNav
            session={session ? { userId: session.userId } : null}
            initialCredits={navCredits}
          >
            {children}
          </ConditionalNav>
        </Providers>
      </body>
    </html>
  );
}
