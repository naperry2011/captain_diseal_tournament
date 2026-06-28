/**
 * Setup/seeding skeleton. Mirrors the seeding layout — a title block plus a grid
 * of competitor cards — with dojo-coal/steel blocks pulsing softly while the
 * tournament loads.
 */
export default function Loading() {
  return (
    <section className="flex animate-pulse flex-col gap-6" aria-hidden="true">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="h-9 w-56 rounded bg-dojo-steel" />
          <div className="h-4 w-40 rounded bg-dojo-coal" />
        </div>
        <div className="h-9 w-32 rounded bg-dojo-coal" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-lg border border-dojo-steel bg-dojo-coal"
          />
        ))}
      </div>
    </section>
  );
}
