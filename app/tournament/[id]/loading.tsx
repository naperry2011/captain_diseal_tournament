/**
 * Bracket-view skeleton. Mirrors the loaded layout's shape — a title block plus
 * a row of bracket columns — with dojo-coal/steel blocks pulsing softly so the
 * screen-shared view never flashes blank.
 */
export default function Loading() {
  return (
    <section className="flex animate-pulse flex-col gap-6" aria-hidden="true">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="h-9 w-64 rounded bg-dojo-steel" />
          <div className="h-5 w-20 rounded bg-dojo-coal" />
        </div>
        <div className="h-9 w-28 rounded bg-dojo-coal" />
      </div>

      <div className="flex gap-8 overflow-hidden">
        {[5, 4, 3].map((rows, col) => (
          <div key={col} className="flex flex-1 flex-col justify-around gap-6">
            {Array.from({ length: rows }).map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-lg border border-dojo-steel bg-dojo-coal"
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
