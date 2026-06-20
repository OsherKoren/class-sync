"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function ErrorBoundaryContent({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("common");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="text-4xl">⚠️</div>
        <h1 className="text-2xl font-bold">{t("errorTitle")}</h1>
        <p className="text-muted-foreground">{t("errorDescription")}</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset}>{t("tryAgain")}</Button>
          <Button variant="outline" onClick={() => history.back()}>
            {t("goBack")}
          </Button>
        </div>
      </div>
    </div>
  );
}
