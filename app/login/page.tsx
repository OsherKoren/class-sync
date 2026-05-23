"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
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
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LogoPill } from "@/components/LogoPill";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();

  const oauthError = searchParams.get("error");
  const oauthErrorMessage =
    oauthError === "OAuthAccountNotLinked"
      ? t("auth.oauthAccountNotLinked")
      : oauthError
      ? t("common.somethingWentWrong")
      : null;

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(t('auth.invalidCredentials'));
    } else {
      // Get the updated session with the role
      const newSession = await fetch("/api/auth/session").then((res) => res.json());
      if (!newSession?.user?.registrationComplete) {
        router.push("/register/complete");
      } else {
        router.push(getDashboardUrl(newSession?.user?.role));
      }
      router.refresh();
    }
  }

  function getDashboardUrl(role?: string): string {
    switch (role) {
      case "TEACHER":
        return "/teacher/dashboard";
      case "STUDENT":
        return "/student/dashboard";
      case "GUARDIAN":
      default:
        return "/guardian/dashboard";
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="absolute top-4 end-4">
        <LanguageSwitcher />
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <LogoPill className="mx-auto mb-2">{t('common.appName')}</LogoPill>
          <CardDescription>{t('auth.signInTitle')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {oauthErrorMessage && (
            <p className="text-sm text-destructive text-center">{oauthErrorMessage}</p>
          )}
          <Button
            variant="outline"
            className="w-full"
            onClick={() =>
              signIn("google", { callbackUrl: "/" })
            }
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden>
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {t('auth.continueWithGoogle')}
          </Button>

          <div className="relative flex items-center">
            <Separator className="flex-1" />
            <span className="mx-3 text-xs text-muted-foreground">{t('auth.or')}</span>
            <Separator className="flex-1" />
          </div>

          <form onSubmit={handleCredentials} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                dir="ltr"
                placeholder={t('auth.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
                >
                  {t('auth.forgotPassword')}
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
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
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('auth.signingIn') : t('common.signIn')}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            {t('auth.newHere')}{" "}
            <Link href="/register" className="underline underline-offset-4">
              {t('auth.createAccount')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
