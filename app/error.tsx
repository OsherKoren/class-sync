"use client";

import { ErrorBoundaryContent } from "@/components/ErrorBoundaryContent";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorBoundaryContent error={error} reset={reset} />;
}
