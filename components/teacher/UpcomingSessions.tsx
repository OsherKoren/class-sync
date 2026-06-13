"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cancelClassSession, findOrCreateLessonSession } from "@/lib/actions/class";

function getNextOccurrences(dayOfWeek: number, count: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  while (dates.length < count) {
    if (d.getDay() === dayOfWeek) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      dates.push(`${y}-${m}-${day}`);
    }
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

function formatDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function UpcomingSessions({
  classId,
  dayOfWeek,
  startTime,
  isRecurring,
  initialCancelledDates,
}: {
  classId: string;
  dayOfWeek: number;
  startTime: string;
  isRecurring: boolean;
  initialCancelledDates: string[];
}) {
  const t = useTranslations("teacher.classDetail");
  const router = useRouter();
  const [cancelledDates, setCancelledDates] = useState<Set<string>>(
    new Set(initialCancelledDates),
  );
  const [confirming, setConfirming] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [rescheduling, setRescheduling] = useState<string | null>(null);
  const [error, setError] = useState("");

  // For one-time classes show only 1 session; for recurring show 5
  const upcomingDates = getNextOccurrences(dayOfWeek, isRecurring ? 5 : 1);

  async function handleCancel(date: string) {
    setCancelling(date);
    setConfirming(null);
    setError("");
    const result = await cancelClassSession(classId, date);
    if ("error" in result) {
      setError(result.error);
    } else {
      setCancelledDates((prev) => new Set([...prev, date]));
    }
    setCancelling(null);
  }

  async function handleReschedule(date: string) {
    setRescheduling(date);
    setError("");
    const result = await findOrCreateLessonSession(classId, date);
    if ("error" in result) {
      setError(result.error);
      setRescheduling(null);
      return;
    }
    router.push(`/teacher/reschedule/${result.data.sessionId}`);
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{t("upcomingSessions")}</CardTitle>
        <CardDescription>{t("upcomingSessionsDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        {error && <p className="text-destructive text-sm mb-4">{error}</p>}
        <div className="space-y-2">
          {upcomingDates.map((date) => {
            const isCancelled = cancelledDates.has(date);
            const isConfirming = confirming === date;
            const isCancelling = cancelling === date;
            const isRescheduling = rescheduling === date;

            return (
              <div
                key={date}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{formatDate(date)}</p>
                  <p className="text-sm text-muted-foreground">{startTime}</p>
                </div>

                {isCancelled ? (
                  <span className="text-sm font-medium text-destructive">
                    {t("sessionCancelled")}
                  </span>
                ) : isConfirming ? (
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <span className="text-sm text-muted-foreground hidden sm:inline">
                      {t("cancelConfirmTitle")}
                    </span>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={isCancelling}
                      onClick={() => handleCancel(date)}
                    >
                      {isCancelling ? t("cancelling") : t("cancelConfirmYes")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirming(null)}
                    >
                      {t("cancelConfirmNo")}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isRescheduling}
                      onClick={() => handleReschedule(date)}
                    >
                      {isRescheduling ? t("rescheduling") : t("rescheduleSession")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirming(date)}
                    >
                      {t("cancelSession")}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
