"use client";

import { useState } from "react";

/**
 * External cover thumbnail (e.g. AniList) rendered as a plain <img> since the
 * hosts aren't configured for next/image. If the URL is missing or fails to
 * load, falls back to a neutral steel placeholder so a dead link never shows a
 * broken-image icon.
 */
export default function CoverImage({
  src,
  alt = "",
  className = "",
}: {
  src?: string | null;
  alt?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <div className={`bg-dojo-steel ${className}`} aria-hidden="true" />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
