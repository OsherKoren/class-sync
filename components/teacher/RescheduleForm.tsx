"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { createRescheduleOffer } from "@/lib/actions/reschedule";
import { Loader2 } from "lucide-react";

export function RescheduleForm({
  sessionId,
  classId,
}: {
  sessionId: string;
  classId: string;
}) {
  const t = useTranslations("teacher.reschedule");
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim() || !date || !time) {
      setError(t("fillRequired"));
      return;
    }
    setSubmitting(true);
    setError("");

    const result = await createRescheduleOffer(sessionId, {
      label: label.trim(),
      scheduledAt: new Date(`${date}T${time}`).toISOString(),
    });

    if ("error" in result) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    router.push(`/teacher/reschedule/${result.data.offerId}/results`);
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="label">{t("slotLabel")}</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t("slotLabelPlaceholder")}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="date">{t("optionDate")}</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="time">{t("optionTime")}</Label>
              <Input
                id="time"
                type="text"
                inputMode="numeric"
                placeholder="HH:MM"
                pattern="^([01]\d|2[0-3]):[0-5]\d$"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3">
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {submitting ? t("submitting") : t("submit")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/teacher/classes/${classId}`)}
            >
              {t("backToClass")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
