import Image from "next/image";
import Link from "next/link";

/**
 * Full-width branded banner header for Captain Diesel's Dojo.
 * Renders the wide/short logo banner (~1700x300) capped at ~180px tall,
 * cover-cropped, with a thin blood-red bottom rule. Links back to home.
 */
export default function LogoHeader() {
  return (
    <header className="w-full border-b border-dojo-red">
      <Link href="/" aria-label="Captain Diesel's Dojo — home" className="block">
        <div className="relative h-[120px] w-full sm:h-[150px] md:h-[180px]">
          <Image
            src="/logo-banner.jpg"
            alt="Captain Diesel's Dojo"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>
      </Link>
    </header>
  );
}
