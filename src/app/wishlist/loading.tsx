export default function Loading() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 p-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-border-subtle bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-surface-2" />
          <div className="flex flex-col gap-1.5">
            <div className="h-5 w-32 animate-pulse rounded-full bg-surface-2" />
            <div className="h-4 w-24 animate-pulse rounded-full bg-surface-2" />
          </div>
        </div>
        <div className="h-10 w-32 animate-pulse rounded-full bg-surface-2" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-2xl border border-border-subtle bg-surface p-3">
            <div className="h-20 w-full animate-pulse rounded-lg bg-surface-2" />
            <div className="h-4 w-3/4 animate-pulse rounded-full bg-surface-2" />
            <div className="h-3 w-1/2 animate-pulse rounded-full bg-surface-2" />
            <div className="h-7 w-full animate-pulse rounded-full bg-surface-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
