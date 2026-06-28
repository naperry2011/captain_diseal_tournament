/**
 * App-level loading fallback. A simple on-brand skeleton for any route segment
 * that doesn't supply its own loading.tsx.
 */
export default function Loading() {
  return (
    <section className="flex animate-pulse flex-col gap-6" aria-hidden="true">
      <div className="h-9 w-64 rounded bg-dojo-steel" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-32 rounded-lg border border-dojo-steel bg-dojo-coal"
          />
        ))}
      </div>
    </section>
  );
}
