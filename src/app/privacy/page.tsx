import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Valorant Skin Value",
  description: "How Valorant Skin Value collects, stores, and uses your data.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold">Privacy Policy</h1>
        <p className="text-sm text-zinc-500">Last updated: July 2026</p>
      </div>

      <p className="text-sm text-zinc-300">
        Myradianite (&quot;the site&quot;) is a fan-made, non-commercial web application for
        Valorant players to review and track their skin collections. It is not affiliated
        with, endorsed by, or connected to Riot Games in any way.
      </p>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-lg font-bold">What we collect</h2>
        <p className="text-sm text-zinc-300">When you create an account, we collect:</p>
        <ul className="list-disc pl-5 text-sm text-zinc-300">
          <li>Your email address (used to identify your account)</li>
          <li>Your display name (shown alongside your reviews)</li>
        </ul>
        <p className="text-sm text-zinc-300">When you use the site, we store:</p>
        <ul className="list-disc pl-5 text-sm text-zinc-300">
          <li>Skins you mark as owned or liked</li>
          <li>Reviews you write, including scores and optional text</li>
          <li>Your active loadout configuration</li>
        </ul>
        <p className="text-sm text-zinc-300">
          If you sign in with Google, we receive only your email address and name from
          Google. We do not receive your Google password or any other Google account data.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-lg font-bold">What we don&apos;t collect</h2>
        <ul className="list-disc pl-5 text-sm text-zinc-300">
          <li>Riot Games account credentials or session tokens — ever</li>
          <li>Payment information of any kind</li>
          <li>Match history, rank, or any in-game performance data</li>
          <li>Location data</li>
          <li>Any data from your device beyond what your browser sends with a standard web request</li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-lg font-bold">How your data is stored</h2>
        <p className="text-sm text-zinc-300">
          Account and application data is stored in Supabase, a managed PostgreSQL database
          platform. Data is protected by row-level security policies that ensure users can
          only access their own private data. We do not sell, rent, or share your data with
          any third parties.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-lg font-bold">Shared collections</h2>
        <p className="text-sm text-zinc-300">
          If you choose to generate a shareable loadout link, your active loadout becomes
          visible to anyone with that link. This is opt-in — your collection is private by
          default until you explicitly generate a share link. You can revoke the link at any
          time from your account settings.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-lg font-bold">Third-party services</h2>
        <p className="text-sm text-zinc-300">The site uses the following third-party services:</p>
        <ul className="list-disc pl-5 text-sm text-zinc-300">
          <li>Supabase — database and authentication hosting</li>
          <li>Vercel — web hosting</li>
          <li>Google OAuth — optional sign-in (if you choose to use it)</li>
          <li>valorant-api.com — source of skin images and game data (read-only, no user data is sent to this service)</li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-lg font-bold">Changes to this policy</h2>
        <p className="text-sm text-zinc-300">
          If we make material changes to this policy, we&apos;ll update the date at the top
          of this page. Continued use of the site after changes constitutes acceptance of the
          updated policy.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-lg font-bold">Contact</h2>
        <p className="text-sm text-zinc-300">
          Questions or data requests:{" "}
          <Link href="mailto:joshualo1247220@gmail.com" className="text-accent underline">
            joshualo1247220@gmail.com
          </Link>
        </p>
      </section>
    </div>
  );
}
