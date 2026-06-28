"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * App-level error boundary. Catches anything not handled by a more specific
 * segment boundary. Error boundaries must be client components.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="flex min-h-[50vh] flex-col items-center justify-center gap-6 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="display text-4xl text-dojo-red sm:text-5xl">
          Something broke in the dojo
        </h1>
        <p className="max-w-md text-dojo-ash">
          Unexpected error. Try again, or head back to the dashboard.
        </p>
        {error.digest && (
          <p className="font-mono text-xs text-dojo-steel">
            Error ref: {error.digest}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="display rounded bg-dojo-red px-5 py-2 text-sm tracking-widest text-dojo-white shadow-red-glow transition hover:bg-dojo-blood"
        >
          Try again
        </button>
        <Link
          href="/"
          className="display rounded border border-dojo-steel px-5 py-2 text-sm tracking-widest text-dojo-white transition hover:bg-dojo-steel"
        >
          Back to dojo
        </Link>
      </div>
    </section>
  );
}
