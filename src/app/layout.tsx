import type { Metadata } from "next";
import { Geist, Geist_Mono, Chakra_Petch } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "@/app/actions/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Angular, esports-styled display face used for the wordmark and headings —
// kept separate from the body font so paragraphs stay easy to read.
const chakraPetch = Chakra_Petch({
  variable: "--font-chakra-petch",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "MyRadianite — Valorant Skin Value",
  description: "Review skins you actually own, and value your collection.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${chakraPetch.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background">
        <header className="sticky top-0 z-20 h-14 border-b border-border-subtle/80 bg-background/85 backdrop-blur-md">
          <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-4 px-6">
            <Link href="/" className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" aria-hidden="true">
                <defs>
                  <linearGradient id="logo-gradient" x1="0" y1="0" x2="24" y2="24">
                    <stop offset="0" stopColor="#ff4d8f" />
                    <stop offset="1" stopColor="#ff2f92" />
                  </linearGradient>
                </defs>
                <path
                  d="M 12 3.375 A 8.625 8.625 0 0 1 19.95 9.375"
                  fill="none"
                  stroke="url(#logo-gradient)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M 19.95 14.625 A 8.625 8.625 0 0 1 12 20.625"
                  fill="none"
                  stroke="url(#logo-gradient)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M 4.05 14.625 A 8.625 8.625 0 0 1 4.05 9.375"
                  fill="none"
                  stroke="url(#logo-gradient)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path d="M12 7.5 15.75 12 12 16.5 8.25 12Z" fill="url(#logo-gradient)" />
              </svg>
              {/* The full combined name is long enough to wrap onto a second
                  line at in-between widths (e.g. a laptop window snapped to
                  half-screen), which would overflow the header's fixed h-14
                  — other pages' sticky sub-navs (e.g. the catalog filter
                  bar) assume that exact height via `top-14`. Showing just
                  "MyRadianite" in that band avoids the wrap; the full name
                  still appears here at lg+ and unconditionally in the home
                  page hero. */}
              <span className="hidden font-display text-lg font-bold tracking-tight text-foreground sm:inline">
                <span className="lg:hidden">MyRadianite</span>
                <span className="hidden lg:inline">MyRadianite Valorant Skin Value</span>
              </span>
            </Link>
            <nav className="flex items-center gap-1 text-sm sm:gap-2">
              {user ? (
                <>
                  <Link
                    href="/collection"
                    className="rounded-full px-2.5 py-1.5 font-medium text-zinc-300 transition-colors hover:bg-surface hover:text-foreground sm:px-3"
                  >
                    <span className="sm:hidden">Mine</span>
                    <span className="hidden sm:inline">My Collection</span>
                  </Link>
                  <Link
                    href="/catalog"
                    className="rounded-full px-2.5 py-1.5 font-medium text-zinc-300 transition-colors hover:bg-surface hover:text-foreground sm:px-3"
                  >
                    <span className="sm:hidden">Catalog</span>
                    <span className="hidden sm:inline">Skin Catalog</span>
                  </Link>
                  <Link
                    href="/wishlist"
                    aria-label="Liked Skins"
                    className="rounded-full px-2.5 py-1.5 font-medium text-zinc-300 transition-colors hover:bg-surface hover:text-foreground sm:px-3"
                  >
                    <span className="sm:hidden" aria-hidden="true">
                      ♥
                    </span>
                    <span className="hidden sm:inline">Liked</span>
                  </Link>
                  <span
                    title={user.email}
                    className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-strong text-xs font-bold text-white"
                  >
                    {user.email?.[0]?.toUpperCase() ?? "?"}
                  </span>
                  <form action={logout}>
                    <button
                      type="submit"
                      className="cursor-pointer rounded-full px-3 py-1.5 font-medium text-zinc-400 transition-colors hover:bg-surface hover:text-foreground"
                    >
                      Log out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-full px-3 py-1.5 font-medium text-zinc-300 transition-colors hover:bg-surface hover:text-foreground"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="rounded-full bg-gradient-to-r from-accent to-accent-strong px-4 py-1.5 font-semibold text-white shadow-[0_0_20px_-6px_rgba(255,47,146,0.8)] transition-transform hover:scale-105"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>
        {children}
        <footer className="flex flex-col items-center gap-2 border-t border-border-subtle/80 px-6 py-4 text-center text-xs text-zinc-400">
          <p>
            Valorant Skin Value isn&apos;t endorsed by Riot Games and doesn&apos;t reflect the
            views or opinions of Riot Games or anyone officially involved in producing or
            managing VALORANT. VALORANT and Riot Games are trademarks or registered
            trademarks of Riot Games, Inc.
          </p>
          <Link href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </Link>
        </footer>
      </body>
    </html>
  );
}
