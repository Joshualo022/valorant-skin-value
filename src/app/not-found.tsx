import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <span className="font-display text-5xl font-bold text-zinc-700">404</span>
      <h1 className="font-display text-xl font-bold">Page not found</h1>
      <p className="text-sm text-zinc-400">
        The skin, page, or link you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-full bg-gradient-to-r from-accent to-accent-strong px-5 py-2 text-sm font-semibold text-white shadow-[0_0_20px_-6px_rgba(255,47,146,0.8)] transition-transform hover:scale-105"
      >
        Back to home
      </Link>
    </div>
  );
}
