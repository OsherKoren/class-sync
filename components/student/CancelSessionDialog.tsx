"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cancelOneSession, requestEnrollment } from "@/lib/actions/student";
import { SUBJECT_KEYS } from "@/lib/classKeys";

type AlternativeClass = {
  id: string;
  name: string;
  subject: string;
  dayOfWeek: number;
  startTime: string;
  teacherName: string | null;
  isOpen: boolean;
  spotsLeft: number | null;
};

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function CancelSessionDialog({
  classId,
  className,
  date,
  onClose,
  onCancelled,
  alternatives,
}: {
  classId: string;
  className: string;
  date: string;
  onClose: () => void;
  onCancelled: () => void;
  alternatives: AlternativeClass[];
}) {
  const t = useTranslations();
  const [step, setStep] = useState<"confirm" | "alternatives">("confirm");
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");
  const [requesting, setRequesting] = useState<string | null>(null);
  const [requested, setRequested] = useState<Set<string>>(new Set());

  async function handleCancel() {
    setCancelling(true);
    const result = await cancelOneSession(classId, date);
    if ("error" in result) {
      setError(result.error);
    } else {
      onCancelled();
      setStep("alternatives");
    }
    setCancelling(false);
  }

  async function handleRequest(altClassId: string) {
    setRequesting(altClassId);
    const result = await requestEnrollment(altClassId);
    if ("error" in result) setError(result.error);
    else setRequested((prev) => new Set([...prev, altClassId]));
    setRequesting(null);
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-xl shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {step === "confirm" ? (
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-2">
              {t("student.classes.cancelDialog.title")}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {t("student.classes.cancelDialog.body", {
                className,
                date: formatDate(date),
              })}
            </p>
            {error && <p className="text-destructive text-sm mb-4">{error}</p>}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>
                {t("common.cancel")}
              </Button>
              <Button variant="destructive" onClick={handleCancel} disabled={cancelling}>
                {cancelling
                  ? t("student.classes.cancelDialog.cancelling")
                  : t("student.classes.cancelDialog.confirm")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-1">
              {t("student.classes.cancelDialog.cancelledTitle")}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {t("student.classes.cancelDialog.cancelledBody")}
            </p>
            {error && <p className="text-destructive text-sm mb-3">{error}</p>}
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {alternatives.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t("student.classes.cancelDialog.noAlternatives")}
                </p>
              ) : (
                alternatives.map((cls) => (
                  <div
                    key={cls.id}
                    className="flex items-center justify-between border rounded-lg px-3 py-2 gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{cls.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {SUBJECT_KEYS.has(cls.subject)
                          ? t(`teacher.createClass.subjects.${cls.subject}` as `teacher.createClass.subjects.${string}`)
                          : cls.subject}
                        {" · "}
                        {t(`days.${cls.dayOfWeek}` as `days.${number}`)} {cls.startTime}
                        {cls.teacherName && ` · ${cls.teacherName}`}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={requested.has(cls.id) ? "outline" : "default"}
                      disabled={requesting === cls.id || requested.has(cls.id) || !cls.isOpen}
                      onClick={() => handleRequest(cls.id)}
                      className="shrink-0"
                    >
                      {requested.has(cls.id)
                        ? t("student.classes.requested")
                        : requesting === cls.id
                        ? t("student.classes.requesting")
                        : t("student.classes.request")}
                    </Button>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end mt-4">
              <Button onClick={onClose}>{t("student.classes.cancelDialog.done")}</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
