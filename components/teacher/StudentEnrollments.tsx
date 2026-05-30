"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { unenrollStudent } from "@/lib/actions/guardian";
import { useTranslations } from "next-intl";
import { SUBJECT_KEYS } from "@/lib/classKeys";

type Enrollment = {
  id: string;
  status: string;
  class: { id: string; name: string; subject: string; dayOfWeek: number; startTime: string; duration: number };
};

function renderRows(
  enrollments: Enrollment[],
  statusLabel: string,
  statusClass: string,
  removingId: string | null,
  onRemove: (id: string) => void,
  removeLabel: string,
  removingLabel: string,
  subjectLabel: (s: string) => string,
  dayLabel: (d: number) => string
) {
  return enrollments.map((e) => (
    <div key={e.id} className="flex items-center justify-between p-3 border rounded-lg">
      <div>
        <p className="font-medium text-sm">{e.class.name}</p>
        <p className="text-xs text-muted-foreground">
          {subjectLabel(e.class.subject)} · {dayLabel(e.class.dayOfWeek)} {e.class.startTime}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-xs font-medium ${statusClass}`}>{statusLabel}</span>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive h-7 px-2 text-xs"
          disabled={removingId === e.id}
          onClick={() => onRemove(e.id)}
        >
          {removingId === e.id ? removingLabel : removeLabel}
        </Button>
      </div>
    </div>
  ));
}

export function StudentEnrollments({ initialEnrollments }: { initialEnrollments: Enrollment[] }) {
  const [enrollments, setEnrollments] = useState(initialEnrollments);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const t = useTranslations();

  async function handleRemove(id: string) {
    setRemovingId(id);
    const result = await unenrollStudent(id);
    if ("data" in result) setEnrollments((prev) => prev.filter((e) => e.id !== id));
    setRemovingId(null);
  }

  const subjectLabel = (s: string) =>
    SUBJECT_KEYS.has(s)
      ? t(`teacher.createClass.subjects.${s}` as `teacher.createClass.subjects.${string}`)
      : s;

  const dayLabel = (d: number) => t(`days.${d}` as `days.${number}`);

  const active = enrollments.filter((e) => e.status === "ACTIVE");
  const pending = enrollments.filter((e) => e.status === "PENDING");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("teacher.studentDetail.enrollments")}</CardTitle>
        <CardDescription>{t("teacher.studentDetail.enrollmentsDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        {enrollments.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("teacher.studentDetail.noEnrollments")}</p>
        ) : (
          <div className="space-y-2">
            {renderRows(active, t("teacher.studentDetail.active"), "text-green-600 dark:text-green-400", removingId, handleRemove, t("teacher.studentDetail.unenroll"), t("teacher.studentDetail.unenrolling"), subjectLabel, dayLabel)}
            {renderRows(pending, t("teacher.studentDetail.pending"), "text-amber-600 dark:text-amber-400", removingId, handleRemove, t("teacher.studentDetail.unenroll"), t("teacher.studentDetail.unenrolling"), subjectLabel, dayLabel)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
