"use client";

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateLocale, updateTheme } from "@/lib/actions/settings";
import { cn } from "@/lib/utils";
import { InstallButton } from "@/components/pwa/InstallButton";

const THEMES = [
  { value: "light", Icon: Sun, key: "themeLight" },
  { value: "dark", Icon: Moon, key: "themeDark" },
  { value: "system", Icon: Monitor, key: "themeSystem" },
] as const;

export function GuardianSettingsClient({
  initialLocale,
  children,
}: {
  initialLocale: string;
  children?: React.ReactNode;
}) {
  const t = useTranslations();
  const { theme, setTheme } = useTheme();
  const [locale, setLocale] = useState(initialLocale);
  const [saving, setSaving] = useState(false);

  async function switchLocale(next: "he" | "en") {
    if (next === locale || saving) return;
    setSaving(true);
    setLocale(next);
    await updateLocale(next);
    window.location.reload();
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-lg mx-auto">
        <Link
          href="/guardian/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
        >
          {t("guardian.settings.backToDashboard")}
        </Link>
        <h1 className="text-3xl font-bold mb-8">{t("guardian.settings.title")}</h1>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("common.language")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {(["he", "en"] as const).map((loc) => (
                  <Button
                    key={loc}
                    variant={locale === loc ? "default" : "outline"}
                    onClick={() => switchLocale(loc)}
                    disabled={saving}
                  >
                    {loc === "he" ? t("common.hebrew") : t("common.english")}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("common.theme")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {THEMES.map(({ value, Icon, key }) => (
                  <Button
                    key={value}
                    variant={theme === value ? "default" : "outline"}
                    onClick={() => { setTheme(value); updateTheme(value).catch(console.error); }}
                    className={cn("gap-2")}
                  >
                    <Icon className="h-4 w-4" />
                    {t(`common.${key}` as `common.${typeof key}`)}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("guardian.students.title")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Link href="/guardian/students">
                <Button variant="outline" className="w-full">
                  {t("guardian.dashboard.addChild")}
                </Button>
              </Link>
              <Link href="/guardian/link">
                <Button variant="outline" className="w-full">
                  {t("guardian.dashboard.linkViaCode")}
                </Button>
              </Link>
            </CardContent>
          </Card>

          {children}
          <InstallButton />
        </div>
      </div>
    </div>
  );
}
