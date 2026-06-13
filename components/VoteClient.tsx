"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { submitVote } from "@/lib/actions/reschedule";

type Offer = {
  id: string;
  status: string;
  resolvedOptionId: string | null;
  options: Array<{ id: string; label: string; scheduledAt: string; voteCount: number }>;
  myVoteOptionId: string | null;
};

function formatDT(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function VoteClient({ offer }: { offer: Offer }) {
  const t = useTranslations("teacher.vote");
  const [myVote, setMyVote] = useState<string | null>(offer.myVoteOptionId);
  const [voting, setVoting] = useState<string | null>(null);
  const [error, setError] = useState("");

  const resolved = offer.status === "RESOLVED";
  const winner = offer.options.find((o) => o.id === offer.resolvedOptionId);

  if (resolved) {
    return (
      <div className="rounded-lg border p-6 bg-muted/40 text-center">
        <p className="text-lg font-semibold">
          {t("resolved", { label: winner?.label ?? "" })}
        </p>
        {winner && (
          <p className="text-sm text-muted-foreground mt-2">{formatDT(winner.scheduledAt)}</p>
        )}
      </div>
    );
  }

  async function handleVote(optionId: string) {
    if (voting) return;
    setVoting(optionId);
    setError("");
    const result = await submitVote(offer.id, optionId);
    if ("error" in result) {
      setError(result.error);
    } else {
      setMyVote(optionId);
    }
    setVoting(null);
  }

  const myVoteLabel = offer.options.find((o) => o.id === myVote)?.label;

  return (
    <div className="space-y-4">
      {myVote && (
        <p className="text-sm text-muted-foreground mb-2">
          {t("voted", { label: myVoteLabel ?? "" })} —{" "}
          <button className="underline" onClick={() => setMyVote(null)}>
            {t("change")}
          </button>
        </p>
      )}

      {offer.options.map((opt) => {
        const isVoted = myVote === opt.id;
        return (
          <Button
            key={opt.id}
            variant={isVoted ? "default" : "outline"}
            className="w-full h-auto py-5 flex flex-col items-center gap-1"
            disabled={!!voting}
            onClick={() => handleVote(opt.id)}
          >
            <span className="text-lg font-semibold">{opt.label}</span>
            <span className="text-sm opacity-80">{formatDT(opt.scheduledAt)}</span>
          </Button>
        );
      })}

      {error && <p className="text-sm text-destructive text-center">{error}</p>}
    </div>
  );
}
