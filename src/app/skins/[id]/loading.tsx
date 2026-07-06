export default function Loading() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-6 rounded-2xl border border-border-subtle bg-surface p-6 sm:flex-row">
        <div className="h-40 w-full shrink-0 animate-pulse rounded-xl bg-surface-2 sm:w-64" />
        <div className="flex flex-col gap-2">
          <div className="h-6 w-48 animate-pulse rounded-full bg-surface-2" />
          <div className="h-4 w-32 animate-pulse rounded-full bg-surface-2" />
          <div className="h-4 w-24 animate-pulse rounded-full bg-surface-2" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 rounded-2xl border border-border-subtle bg-surface p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="h-7 w-12 animate-pulse rounded-full bg-surface-2" />
            <div className="h-3 w-16 animate-pulse rounded-full bg-surface-2" />
          </div>
        ))}
      </div>

      <div className="h-11 w-40 animate-pulse rounded-full bg-surface-2" />

      <div className="flex flex-col gap-3">
        <div className="h-5 w-24 animate-pulse rounded-full bg-surface-2" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl border border-border-subtle bg-surface" />
        ))}
      </div>
    </div>
  );
}
