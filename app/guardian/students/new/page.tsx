"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createStudentForSelf } from "@/lib/actions/guardian-dashboard";
import { useTranslations } from "next-intl";

export default function NewStudentPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const t = useTranslations();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    setError("");
    const result = await createStudentForSelf({ name: trimmed });
    if ("error" in result) {
      setError(result.error);
      setSaving(false);
    } else {
      router.push(`/guardian/students/${result.data.id}/link`);
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-md mx-auto">
        <Link
          href="/guardian/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
        >
          {t('guardian.addChild.backToDashboard')}
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>{t('guardian.addChild.title')}</CardTitle>
            <CardDescription>
              {t('guardian.addChild.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('guardian.addChild.childName')}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('guardian.addChild.namePlaceholder')}
                  required
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={saving || !name.trim()} className="w-full">
                {saving ? t('guardian.addChild.creating') : t('guardian.addChild.create')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
