"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { resolveOffer } from "@/lib/actions/reschedule";
import type { RescheduleOfferData } from "@/lib/actions/reschedule";

function formatDT(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function ResolveOfferClient({ offer }: { offer: RescheduleOfferData }) {
  const t = useTranslations("teacher.reschedule");
  const router = useRouter();
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState("");

  const resolved = offer.status === "RESOLVED";
  const total = offer.yesCount + offer.noCount;

  async function handleResolve() {
    setResolving(true);
    setError("");
    const result = await resolveOffer(offer.id);
    if ("error" in result) {
      setError(result.error);
      setResolving(false);
      return;
    }
    router.refresh();
  }

  if (resolved) {
    return (
      <div className="rounded-lg border p-6 bg-muted/40">
        <p className="text-lg font-semibold">{t("resolved", { label: offer.option.label })}</p>
        <p className="text-sm text-muted-foreground mt-1">{formatDT(offer.option.scheduledAt)}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-5">
        <p className="text-sm text-muted-foreground mb-1">{t("proposedSlot")}</p>
        <p className="font-semibold text-lg">{offer.option.label}</p>
        <p className="text-sm text-muted-foreground">{formatDT(offer.option.scheduledAt)}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="rounded-lg border p-4">
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">{offer.yesCount}</p>
          <p className="text-sm text-muted-foreground mt-1">{t("canAttend")}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-3xl font-bold text-red-500 dark:text-red-400">{offer.noCount}</p>
          <p className="text-sm text-muted-foreground mt-1">{t("cannotAttend")}</p>
        </div>
      </div>

      {total === 0 && (
        <p className="text-sm text-muted-foreground">{t("noVotes")}</p>
      )}

      <Button onClick={handleResolve} disabled={resolving}>
        {resolving ? t("resolving") : t("resolve")}
      </Button>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
