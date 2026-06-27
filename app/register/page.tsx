"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { registerGuardian, registerStudent } from "@/lib/actions/auth";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LogoPill } from "@/components/LogoPill";

function RegisterForm() {
  const [role, setRole] = useState<"GUARDIAN" | "STUDENT">("GUARDIAN");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const t = useTranslations();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError(t("auth.passwordsNoMatch"));
      return;
    }
    setLoading(true);
    setError("");

    const result =
      role === "STUDENT"
        ? await registerStudent({ name, email, password })
        : await registerGuardian({ name, email, password });

    if ("error" in result) {
      setError(result.error);
      setLoading(false);
      return;
    }

    const signInResult = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (signInResult?.error) {
      setError("Account created but sign-in failed. Please try logging in.");
    } else {
      const redirectUrl =
        role === "STUDENT"
          ? code
            ? `/student/link?code=${code}`
            : "/student/dashboard"
          : "/guardian/dashboard";
      router.push(redirectUrl);
      router.refresh();
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t("auth.registerTitle")}</CardTitle>
        <CardDescription>{t("auth.signUpSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => signIn("google", { callbackUrl: "/register/complete" })}
        >
          <svg className="me-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden>
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
          {t("auth.signUpWithGoogle")}
        </Button>

        <div className="relative flex items-center">
          <Separator className="flex-1" />
          <span className="mx-3 text-xs text-muted-foreground">
            {t("auth.or")}
          </span>
          <Separator className="flex-1" />
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant={role === "GUARDIAN" ? "default" : "outline"}
            className="flex-1"
            onClick={() => setRole("GUARDIAN")}
          >
            {t("auth.imParent")}
          </Button>
          <Button
            type="button"
            variant={role === "STUDENT" ? "default" : "outline"}
            className="flex-1"
            onClick={() => setRole("STUDENT")}
          >
            {t("auth.imStudent")}
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">{t("auth.fullName")}</Label>
            <Input
              id="name"
              type="text"
              placeholder={t("auth.namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input
              id="email"
              type="email"
              dir="ltr"
              placeholder={t("auth.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                dir="ltr"
                placeholder={t("auth.atLeast8")}
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
            <Label htmlFor="confirm">{t("auth.confirmPassword")}</Label>
            <div className="relative">
              <Input
                id="confirm"
                type={showConfirm ? "text" : "password"}
                dir="ltr"
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
            {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {loading ? t("auth.creatingAccount") : t("auth.registerTitle")}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          {t("auth.alreadyHaveAccount")}{" "}
          <Link href="/login" className="underline underline-offset-4">
            {t("common.signIn")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function RegisterPage() {
  const t = useTranslations();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 pt-14">
      <header className="fixed top-0 inset-x-0 z-50 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-full items-center justify-between px-4">
          <LogoPill href="/" className="hover:bg-primary/90 transition-colors">
            {t("common.appName")}
          </LogoPill>
          <LanguageSwitcher />
        </div>
      </header>
      <Suspense fallback={null}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
