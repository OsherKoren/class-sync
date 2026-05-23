"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { redeemLinkCode } from "@/lib/actions/link-code";
import { useTranslations } from "next-intl";

export default function GuardianLinkPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const t = useTranslations();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setError("");
    const result = await redeemLinkCode(trimmed);
    if ("error" in result) {
      setError(result.error);
      setSubmitting(false);
    } else {
      router.push("/guardian/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-md mx-auto">
        <Link
          href="/guardian/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
        >
          {t('guardian.link.backToDashboard')}
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>{t('guardian.link.title')}</CardTitle>
            <CardDescription>
              {t('guardian.link.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">{t('guardian.link.inviteCode')}</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ""))}
                  placeholder={t('guardian.link.codePlaceholder')}
                  maxLength={6}
                  className="font-mono tracking-widest text-center text-xl uppercase"
                  autoFocus
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={submitting || !code.trim()} className="w-full">
                {submitting ? t('guardian.link.linking') : t('guardian.link.linkAccount')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
