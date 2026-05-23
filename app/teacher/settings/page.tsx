"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateLocale } from "@/lib/actions/settings";
import { useTranslations } from "next-intl";

export default function TeacherSettingsPage() {
  const [saving, setSaving] = useState(false);
  const t = useTranslations();

  async function handleLocale(locale: "he" | "en") {
    setSaving(true);
    const result = await updateLocale(locale);
    setSaving(false);
    if (!("error" in result)) {
      window.location.reload();
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/teacher/dashboard" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">
            {t('common.backToDashboard')}
          </Link>
          <h1 className="text-3xl font-bold mb-2">{t('teacher.dashboard.settings')}</h1>
          <p className="text-muted-foreground">{t('teacher.dashboard.settingsDesc')}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('common.language')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button
                variant="outline"
                disabled={saving}
                onClick={() => handleLocale("he")}
              >
                {saving ? "…" : t('common.hebrew')}
              </Button>
              <Button
                variant="outline"
                disabled={saving}
                onClick={() => handleLocale("en")}
              >
                {saving ? "…" : t('common.english')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
