"use client";

export default function Error({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="font-display text-xl font-bold">Something went wrong</h1>
      <p className="text-sm text-zinc-400">
        An unexpected error occurred while loading this page.
      </p>
      <button
        type="button"
        onClick={() => unstable_retry()}
        className="mt-2 cursor-pointer rounded-full bg-gradient-to-r from-accent to-accent-strong px-5 py-2 text-sm font-semibold text-white shadow-[0_0_20px_-6px_rgba(255,47,146,0.8)] transition-transform hover:scale-105"
      >
        Try again
      </button>
    </div>
  );
}
