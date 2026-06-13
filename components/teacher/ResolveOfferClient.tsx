"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { resolveOffer } from "@/lib/actions/reschedule";

type Offer = {
  id: string;
  status: string;
  resolvedOptionId: string | null;
  options: Array<{ id: string; label: string; scheduledAt: string; voteCount: number }>;
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

export function ResolveOfferClient({ offer }: { offer: Offer }) {
  const t = useTranslations("teacher.reschedule");
  const router = useRouter();
  const [resolving, setResolving] = useState<string | null>(null);
  const [error, setError] = useState("");

  const totalVotes = offer.options.reduce((sum, o) => sum + o.voteCount, 0);
  const resolved = offer.status === "RESOLVED";
  const winner = offer.options.find((o) => o.id === offer.resolvedOptionId);

  async function handleResolve(optionId: string) {
    setResolving(optionId);
    setError("");
    const result = await resolveOffer(offer.id, optionId);
    if ("error" in result) {
      setError(result.error);
      setResolving(null);
      return;
    }
    router.refresh();
  }

  if (resolved && winner) {
    return (
      <div className="rounded-lg border p-6 bg-muted/40">
        <p className="text-lg font-semibold">{t("resolved", { label: winner.label })}</p>
        <p className="text-sm text-muted-foreground mt-1">{formatDT(winner.scheduledAt)}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {totalVotes === 0 && (
        <p className="text-sm text-muted-foreground">{t("noVotes")}</p>
      )}
      {offer.options.map((opt) => {
        const pct = totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0;
        return (
          <Card key={opt.id}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{opt.label}</p>
                  <p className="text-sm text-muted-foreground">{formatDT(opt.scheduledAt)}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium shrink-0">
                      {opt.voteCount} {opt.voteCount === 1 ? t("votesCount", { count: opt.voteCount }) : t("votesCountPlural", { count: opt.voteCount })}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  disabled={!!resolving}
                  onClick={() => handleResolve(opt.id)}
                >
                  {resolving === opt.id ? t("resolving") : t("resolve")}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
