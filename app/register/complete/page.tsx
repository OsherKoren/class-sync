"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { completeRegistration } from "@/lib/actions/auth";

type Role = "FAMILY" | "STUDENT" | "TEACHER";

export default function CompleteRegistrationPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

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

    const dashboardMap: Record<Role, string> = {
      FAMILY: "/family/dashboard",
      STUDENT: "/student/dashboard",
      TEACHER: "/teacher/dashboard",
    };
    router.push(dashboardMap[role]);
    router.refresh();
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-2xl font-bold text-primary-foreground">
            C
          </div>
          <CardTitle className="text-2xl">Welcome to ClassSync</CardTitle>
          <CardDescription>Let&apos;s get your account set up</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Hi {session?.user?.name}! What&apos;s your role?
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
                ? "Setting up…"
                : "I'm a student"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full"
              disabled={loading}
              onClick={() => handleComplete("FAMILY")}
            >
              {selectedRole === "FAMILY" && loading
                ? "Setting up…"
                : "I'm a parent"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full"
              disabled={loading}
              onClick={() => handleComplete("TEACHER")}
            >
              {selectedRole === "TEACHER" && loading
                ? "Setting up…"
                : "I'm a teacher"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
