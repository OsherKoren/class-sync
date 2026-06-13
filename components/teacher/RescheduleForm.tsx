"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { createRescheduleOffer } from "@/lib/actions/reschedule";

type Option = { label: string; scheduledAt: string };

export function RescheduleForm({
  sessionId,
  classId,
}: {
  sessionId: string;
  classId: string;
}) {
  const t = useTranslations("teacher.reschedule");
  const router = useRouter();
  const [options, setOptions] = useState<Option[]>([{ label: "", scheduledAt: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function updateOption(index: number, field: keyof Option, value: string) {
    setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, [field]: value } : o)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const valid = options.filter((o) => o.label.trim() && o.scheduledAt);
    if (valid.length === 0) {
      setError("Please fill in at least one option.");
      setSubmitting(false);
      return;
    }

    const result = await createRescheduleOffer(sessionId, {
      options: valid.map((o) => ({
        label: o.label.trim(),
        scheduledAt: new Date(o.scheduledAt).toISOString(),
      })),
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
        <form onSubmit={handleSubmit} className="space-y-6">
          {options.map((opt, idx) => (
            <div key={idx} className="space-y-3 border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {idx === 0 ? t("option1Label") : t("option2Label")}
                </span>
                {idx === 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setOptions((prev) => prev.slice(0, 1))}
                  >
                    {t("removeOption")}
                  </Button>
                )}
              </div>
              <div>
                <Label htmlFor={`label-${idx}`}>
                  {idx === 0 ? t("option1Label") : t("option2Label")}
                </Label>
                <Input
                  id={`label-${idx}`}
                  value={opt.label}
                  onChange={(e) => updateOption(idx, "label", e.target.value)}
                  placeholder={idx === 0 ? "e.g., Monday 10:00" : "e.g., Wednesday 16:00"}
                  required={idx === 0}
                />
              </div>
              <div>
                <Label htmlFor={`date-${idx}`}>
                  {idx === 0 ? t("option1Date") : t("option2Date")}
                </Label>
                <Input
                  id={`date-${idx}`}
                  type="datetime-local"
                  value={opt.scheduledAt}
                  onChange={(e) => updateOption(idx, "scheduledAt", e.target.value)}
                  required={idx === 0}
                />
              </div>
            </div>
          ))}

          {options.length === 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setOptions((prev) => [...prev, { label: "", scheduledAt: "" }])}
            >
              {t("addOption")}
            </Button>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3">
            <Button type="submit" disabled={submitting}>
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
