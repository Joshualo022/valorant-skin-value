export default function Loading() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between gap-4 border-b border-border-subtle/80 py-3">
        <div className="h-6 w-32 animate-pulse rounded-full bg-surface-2" />
        <div className="h-6 w-28 animate-pulse rounded-full bg-surface-2" />
      </div>
      <div className="h-9 w-full max-w-sm animate-pulse rounded-full bg-surface-2" />
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-20 shrink-0 animate-pulse rounded-full bg-surface-2" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-2xl border border-border-subtle bg-surface p-3">
            <div className="h-20 w-full animate-pulse rounded-lg bg-surface-2" />
            <div className="h-4 w-3/4 animate-pulse rounded-full bg-surface-2" />
            <div className="h-3 w-1/2 animate-pulse rounded-full bg-surface-2" />
            <div className="h-7 w-full animate-pulse rounded-full bg-surface-2" />
            <div className="h-7 w-full animate-pulse rounded-full bg-surface-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
