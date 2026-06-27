"use client";

import { ErrorBoundaryContent } from "@/components/ErrorBoundaryContent";

export default function TeacherError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorBoundaryContent error={error} reset={reset} />;
}
