"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { completeRegistration } from "@/lib/actions/auth";
import { useTranslations } from "next-intl";
import { LogoPill } from "@/components/LogoPill";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

type Role = "GUARDIAN" | "STUDENT" | "TEACHER";

const dashboardByRole: Record<Role, string> = {
  GUARDIAN: "/guardian/dashboard",
  STUDENT: "/student/dashboard",
  TEACHER: "/teacher/dashboard",
};

export default function CompleteRegistrationPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const t = useTranslations();

  async function handleComplete(role: Role) {
    setLoading(true);
    setError("");
    setSelectedRole(role);

    const result = await completeRegistration(role);

    if ("error" in result) {
      setError(result.error);
      setLoading(false);
      setSelectedRole(null);
      return;
    }

    // Refresh the JWT cookie so the proxy sees the new role before navigation
    await update();
    router.push(dashboardByRole[role]);
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <p>{t('common.loading')}</p>
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
          <CardTitle className="text-2xl">{t('auth.welcomeTitle')}</CardTitle>
          <CardDescription>{t('auth.welcomeSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            {t('auth.greeting', { name: session?.user?.name ?? "" })}
          </p>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex flex-col gap-2">
            <Button
              size="lg"
              className="w-full"
              disabled={loading}
              onClick={() => handleComplete("STUDENT")}
            >
              {selectedRole === "STUDENT" && loading
                ? t('auth.settingUp')
                : t('auth.imStudent')}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full"
              disabled={loading}
              onClick={() => handleComplete("GUARDIAN")}
            >
              {selectedRole === "GUARDIAN" && loading
                ? t('auth.settingUp')
                : t('auth.imParent')}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full"
              disabled={loading}
              onClick={() => handleComplete("TEACHER")}
            >
              {selectedRole === "TEACHER" && loading
                ? t('auth.settingUp')
                : t('auth.imTeacher')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
