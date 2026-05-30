"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
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
import { resetPassword } from "@/lib/actions/auth";
import { useTranslations } from "next-intl";
import { LogoPill } from "@/components/LogoPill";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function ResetPasswordPage({
  params,
}: {
  params: { token: string };
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const t = useTranslations();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError(t('auth.passwordsNoMatch'));
      return;
    }

    setLoading(true);
    setError("");

    const result = await resetPassword(params.token, password);

    if ("error" in result) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setLoading(false);
    setSuccess(true);

    setTimeout(() => {
      router.push("/login");
      router.refresh();
    }, 2000);
  }

  if (success) {
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
            <CardTitle className="text-2xl">{t('auth.passwordResetSuccess')}</CardTitle>
            <CardDescription>{t('auth.passwordResetSuccessBody')}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t('auth.redirecting')}
            </p>
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
          <CardTitle className="text-2xl">{t('auth.createNewPassword')}</CardTitle>
          <CardDescription>{t('auth.enterNewPassword')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">{t('auth.newPassword')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirm">{t('auth.confirmPassword')}</Label>
              <div className="relative">
                <Input
                  id="confirm"
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('auth.resetting') : t('auth.resetPasswordTitle')}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            <Link href="/login" className="underline underline-offset-4">
              {t('auth.backToSignIn')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
