"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { updateLocale } from "@/lib/actions/settings";

export function LanguageSwitcher({ current: currentProp }: { current?: string } = {}) {
  const localeFromContext = useLocale();
  const current = currentProp ?? localeFromContext;
  const [saving, setSaving] = useState(false);

  async function switchTo(locale: "he" | "en") {
    if (locale === current || saving) return;
    setSaving(true);
    await updateLocale(locale);
    window.location.reload();
  }

  return (
    <div className="flex items-center border border-border rounded-md overflow-hidden text-sm">
      <button
        onClick={() => switchTo("he")}
        disabled={saving}
        className={`px-3 py-1.5 transition-colors ${
          current === "he"
            ? "bg-primary text-primary-foreground font-medium"
            : "bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
        }`}
      >
        עב
      </button>
      <button
        onClick={() => switchTo("en")}
        disabled={saving}
        className={`px-3 py-1.5 transition-colors border-r-0 ${
          current === "en"
            ? "bg-primary text-primary-foreground font-medium"
            : "bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
        }`}
      >
        EN
      </button>
    </div>
  );
}
