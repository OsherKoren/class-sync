"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { submitVote } from "@/lib/actions/reschedule";
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

export function VoteClient({ offer }: { offer: RescheduleOfferData }) {
  const t = useTranslations("teacher.vote");
  const [myVote, setMyVote] = useState<boolean | null>(offer.myVote);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const resolved = offer.status === "RESOLVED";

  if (resolved) {
    return (
      <div className="rounded-lg border p-6 bg-muted/40 text-center">
        <p className="text-lg font-semibold">
          {t("resolved", { label: offer.option.label })}
        </p>
        <p className="text-sm text-muted-foreground mt-2">{formatDT(offer.option.scheduledAt)}</p>
      </div>
    );
  }

  async function handleVote(canAttend: boolean) {
    if (submitting) return;
    setSubmitting(true);
    setError("");
    const result = await submitVote(offer.id, canAttend);
    if ("error" in result) {
      setError(result.error);
    } else {
      setMyVote(canAttend);
    }
    setSubmitting(false);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4 bg-muted/30">
        <p className="text-sm text-muted-foreground mb-1">{t("proposedSlot")}</p>
        <p className="font-semibold text-lg">{offer.option.label}</p>
        <p className="text-sm text-muted-foreground">{formatDT(offer.option.scheduledAt)}</p>
      </div>

      {myVote !== null && (
        <p className="text-sm text-muted-foreground">
          {myVote ? t("votedYes") : t("votedNo")} —{" "}
          <button className="underline" onClick={() => setMyVote(null)}>
            {t("change")}
          </button>
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Button
          variant={myVote === true ? "default" : "outline"}
          className="h-auto py-6 flex flex-col gap-1"
          disabled={submitting}
          onClick={() => handleVote(true)}
        >
          <span className="text-2xl">✅</span>
          <span className="font-semibold">{t("yes")}</span>
          <span className="text-xs opacity-70">{t("yesHint")}</span>
        </Button>

        <Button
          variant={myVote === false ? "destructive" : "outline"}
          className="h-auto py-6 flex flex-col gap-1"
          disabled={submitting}
          onClick={() => handleVote(false)}
        >
          <span className="text-2xl">❌</span>
          <span className="font-semibold">{t("no")}</span>
          <span className="text-xs opacity-70">{t("noHint")}</span>
        </Button>
      </div>

      {error && <p className="text-sm text-destructive text-center">{error}</p>}
    </div>
  );
}
