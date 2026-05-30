"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requestPasswordReset } from "@/lib/actions/auth";
import { useTranslations } from "next-intl";
import { LogoPill } from "@/components/LogoPill";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const t = useTranslations();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await requestPasswordReset(email);

    if ("error" in result) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setLoading(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 pt-14">
        <header className="fixed top-0 inset-x-0 z-50 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-full items-center justify-between px-4">
            <LogoPill href="/" className="hover:bg-primary/90 transition-colors">
              {t('common.appName')}
            </LogoPill>
            <LanguageSwitcher />
          </div>
        </header>
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t('auth.checkEmail')}</CardTitle>
            <CardDescription>
              {t('auth.resetLinkSent', { email })}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              {t('auth.resetLinkExpiry')}
            </p>
            <Link href="/login" className="w-full">
              <Button className="w-full">{t('auth.backToSignIn')}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 pt-14">
      <header className="fixed top-0 inset-x-0 z-50 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-full items-center justify-between px-4">
          <LogoPill href="/" className="hover:bg-primary/90 transition-colors">
            {t('common.appName')}
          </LogoPill>
          <LanguageSwitcher />
        </div>
      </header>
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t('auth.resetPasswordTitle')}</CardTitle>
          <CardDescription>
            {t('auth.resetPasswordSubtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('auth.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('auth.sending') : t('auth.sendResetLink')}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            {t('auth.rememberPassword')}{" "}
            <Link href="/login" className="underline underline-offset-4">
              {t('common.signIn')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
