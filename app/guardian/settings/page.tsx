"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateLocale } from "@/lib/actions/settings";
import { useTranslations } from "next-intl";

export default function GuardianSettingsPage() {
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
      <div className="max-w-md mx-auto">
        <Link
          href="/guardian/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
        >
          {t('guardian.settings.backToDashboard')}
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>{t('guardian.settings.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium mb-3">{t('guardian.settings.language')}</p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                disabled={saving}
                onClick={() => handleLocale("he")}
              >
                {saving ? t('guardian.settings.saving') : t('common.hebrew')}
              </Button>
              <Button
                variant="outline"
                disabled={saving}
                onClick={() => handleLocale("en")}
              >
                {saving ? t('guardian.settings.saving') : t('common.english')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
