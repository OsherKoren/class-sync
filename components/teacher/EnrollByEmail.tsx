"use client";

import { useState } from "react";
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
import { findStudentByEmail, enrollStudentByEmail } from "@/lib/actions/guardian";
import { useTranslations } from "next-intl";

type FoundStudent = { studentId: string; name: string; email: string };

export function EnrollByEmail({ classId }: { classId: string }) {
  const [email, setEmail] = useState("");
  const [found, setFound] = useState<FoundStudent | null>(null);
  const [searching, setSearching] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [error, setError] = useState("");
  const t = useTranslations();

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearching(true);
    setError("");
    setFound(null);
    setEnrolled(false);
    const result = await findStudentByEmail(email);
    if ("error" in result) {
      setError(result.error);
    } else {
      setFound(result.data);
    }
    setSearching(false);
  }

  async function handleEnroll() {
    if (!found) return;
    setEnrolling(true);
    setError("");
    const result = await enrollStudentByEmail(email, classId);
    if ("error" in result) {
      setError(result.error);
    } else {
      setEnrolled(true);
    }
    setEnrolling(false);
  }

  function handleEmailChange(value: string) {
    setEmail(value);
    setFound(null);
    setEnrolled(false);
    setError("");
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{t("teacher.classDetail.enrollByEmail")}</CardTitle>
        <CardDescription>{t("teacher.classDetail.enrollByEmailDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="enroll-email" className="sr-only">
              {t("teacher.classDetail.studentEmail")}
            </Label>
            <Input
              id="enroll-email"
              type="email"
              dir="ltr"
              placeholder="student@email.com"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={searching || !email}>
            {searching
              ? t("teacher.classDetail.searching")
              : t("teacher.classDetail.searchStudent")}
          </Button>
        </form>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {found && !enrolled && (
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">{found.name}</p>
              <p className="text-sm text-muted-foreground ltr">{found.email}</p>
            </div>
            <Button onClick={handleEnroll} disabled={enrolling}>
              {enrolling
                ? t("teacher.classDetail.enrollingStudent")
                : t("teacher.classDetail.enrollStudentBtn")}
            </Button>
          </div>
        )}

        {enrolled && found && (
          <p className="text-sm text-green-600 dark:text-green-400">
            {t("teacher.classDetail.enrolledSuccess", { name: found.name })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
