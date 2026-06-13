"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/hooks/usePwaInstall";

export function InstallBanner() {
  const t = useTranslations("pwa");
  const { installState, install } = usePwaInstall();
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true);
      if (sessionStorage.getItem("pwa-banner-dismissed")) setDismissed(true);
    });
  }, []);

  function dismiss() {
    sessionStorage.setItem("pwa-banner-dismissed", "1");
    setDismissed(true);
  }

  if (!mounted || dismissed || installState === "installed" || installState === "unsupported") {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto bg-card border rounded-xl shadow-lg p-4 flex items-start gap-3">
      <Download className="h-5 w-5 mt-0.5 shrink-0 text-primary" />
      <div className="flex-1 min-w-0">
        {installState === "ios" ? (
          <p className="text-sm">{t("iosInstall")}</p>
        ) : (
          <>
            <p className="text-sm font-medium">{t("installTitle")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t("installSubtitle")}</p>
            <Button
              size="sm"
              className="mt-2"
              onClick={install}
              disabled={installState === "installing"}
            >
              {t("installButton")}
            </Button>
          </>
        )}
      </div>
      <button
        onClick={dismiss}
        className="shrink-0 text-muted-foreground hover:text-foreground"
        aria-label={t("dismiss")}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
