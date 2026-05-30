"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cancelEnrollmentRequest } from "@/lib/actions/student";

export function CancelEnrollmentButton({ classId }: { classId: string }) {
  const t = useTranslations("student.dashboard");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    setLoading(true);
    const result = await cancelEnrollmentRequest(classId);
    if ("error" in result) {
      console.error(result.error);
    } else {
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <Button variant="ghost" size="sm" disabled={loading} onClick={handleCancel}>
      {loading ? "…" : t("cancelRequest")}
    </Button>
  );
}
