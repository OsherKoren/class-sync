"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { findGuardianByEmail, linkGuardianToStudent } from "@/lib/actions/guardian";
import { useTranslations } from "next-intl";

type GuardianResult = { id: string; name: string | null; email: string };

export function LinkGuardianByEmail({ studentId }: { studentId: string }) {
  const [email, setEmail] = useState("");
  const [guardian, setGuardian] = useState<GuardianResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const t = useTranslations();

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearching(true);
    setError("");
    setGuardian(null);
    setSuccess(false);
    const result = await findGuardianByEmail(email);
    if ("error" in result) setError(result.error);
    else setGuardian(result.data);
    setSearching(false);
  }

  async function handleLink() {
    if (!guardian) return;
    setLinking(true);
    setError("");
    const result = await linkGuardianToStudent(email, studentId);
    if ("error" in result) {
      setError(result.error);
    } else {
      setSuccess(true);
      setGuardian(null);
      setEmail("");
      router.refresh();
    }
    setLinking(false);
  }

  return (
    <div className="pt-4 border-t space-y-3">
      <p className="text-sm font-medium">{t("teacher.studentDetail.linkGuardianTitle")}</p>
      <p className="text-xs text-muted-foreground">{t("teacher.studentDetail.linkGuardianDesc")}</p>
      {success && (
        <p className="text-sm text-green-600 dark:text-green-400">{t("teacher.studentDetail.guardianLinked")}</p>
      )}
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          type="email"
          placeholder={t("auth.emailPlaceholder")}
          value={email}
          onChange={(e) => { setEmail(e.target.value); setGuardian(null); setSuccess(false); setError(""); }}
          className="flex-1"
        />
        <Button type="submit" variant="secondary" size="sm" disabled={searching || !email}>
          {searching ? t("teacher.studentDetail.searchingGuardian") : t("teacher.studentDetail.searchGuardian")}
        </Button>
      </form>
      {guardian && (
        <div className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
          <div>
            <p className="text-sm font-medium">{guardian.name ?? t("common.unnamed")}</p>
            <p className="text-xs text-muted-foreground" dir="ltr">{guardian.email}</p>
          </div>
          <Button size="sm" disabled={linking} onClick={handleLink}>
            {linking ? t("teacher.studentDetail.linkingGuardian") : t("teacher.studentDetail.linkGuardianBtn")}
          </Button>
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
