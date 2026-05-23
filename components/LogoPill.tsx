import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoPillProps {
  children: React.ReactNode;
  className?: string;
  href?: string;
}

/**
 * Logo pill with two L-shaped rotation arrows framing the text.
 * Arrow 1: top edge → right edge (arrowhead ↓ at bottom-right).
 * Arrow 2: bottom edge → left edge (arrowhead ↑ at top-left).
 * Together they read as a clockwise sync rotation.
 */
export function LogoPill({ children, className, href }: LogoPillProps) {
  const classes = cn(
    "relative block w-[120px] h-10 rounded-lg bg-primary text-primary-foreground text-sm font-bold",
    className
  );

  const inner = (
    <>
      <svg
        className="absolute inset-0"
        width="120"
        height="40"
        viewBox="0 0 120 40"
        fill="none"
        aria-hidden="true"
      >
        {/* Arrow 1: → along top, rounded corner, ↓ along right, arrowhead at bottom-right */}
        <path
          d="M 14,7 H 108 Q 112,7 112,11 V 33"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="square"
        />
        <path
          d="M 109,29 L 112,33 L 115,29"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Arrow 2: ← along bottom, rounded corner, ↑ along left, arrowhead at top-left */}
        <path
          d="M 106,33 H 12 Q 8,33 8,29 V 7"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="square"
        />
        <path
          d="M 5,11 L 8,7 L 11,11"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center leading-none">
        {children}
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {inner}
      </Link>
    );
  }

  return <div className={classes}>{inner}</div>;
}
