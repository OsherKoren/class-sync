"use client";

import { ErrorBoundaryContent } from "@/components/ErrorBoundaryContent";

export default function GuardianError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorBoundaryContent error={error} reset={reset} />;
}
