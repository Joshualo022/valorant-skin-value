import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Valorant Skin Value",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="flex items-center justify-between px-6 py-4 border-b">
          <Link href="/" className="font-semibold">
            Valorant Skin Value
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            {user ? (
              <>
                <span className="text-zinc-600">{user.email}</span>
                <form action={logout}>
                  <button type="submit" className="underline">
                    Log out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className="underline">
                  Log in
                </Link>
                <Link href="/signup" className="underline">
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
