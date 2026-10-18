import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import { ConditionalNav } from "@/components/ConditionalNav";
import { paymentsEnabled } from '@/lib/product-mode';
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import "./globals.css";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "VirtuFit — The open fitting studio",
  description: "Try clothes in a live AI mirror or generate a finished try-on photo. Upload your own garments and find your next look.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  let navCredits = 0;
  if (session && paymentsEnabled()) {
    const u = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { credits: true },
    });
    navCredits = u?.credits ?? 0;
  }

  return (
    <html lang="en">
      <body
        className="antialiased bg-[var(--vf-page)] text-[var(--vf-ink)]"
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
