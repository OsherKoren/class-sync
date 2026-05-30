"use client";

import { useTranslations } from "next-intl";
import { SUBJECT_KEYS, GRADE_KEYS } from "@/lib/classKeys";
import { toMinutes } from "./calendarUtils";
import type { ReactNode } from "react";

export type SheetClass = {
  name: string;
  subject: string;
  type: string;
  level: string | null;
  grade: string | null;
  dayOfWeek: number;
  startTime: string;
  duration: number;
  teacherName?: string | null;
  enrollmentCount: number;
  maxCapacity: number | null;
};

export function ClassDetailSheet({
  open,
  onClose,
  cls,
  date,
  isCancelled,
  action,
}: {
  open: boolean;
  onClose: () => void;
  cls: SheetClass | null;
  date?: string;
  isCancelled?: boolean;
  action?: ReactNode;
}) {
  const t = useTranslations();
  if (!open || !cls) return null;

  const endMin = toMinutes(cls.startTime) + cls.duration;
  const endTime = `${Math.floor(endMin / 60).toString().padStart(2, "0")}:${(endMin % 60).toString().padStart(2, "0")}`;
  const dateLabel = date
    ? new Date(date + "T12:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex sm:items-center items-end justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-background sm:rounded-xl rounded-t-2xl shadow-xl w-full sm:max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold leading-tight">{cls.name}</h2>
            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium shrink-0 mt-0.5">
              {t(`classTypes.${cls.type}` as `classTypes.${string}`)}
            </span>
          </div>

          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              {SUBJECT_KEYS.has(cls.subject)
                ? t(`teacher.createClass.subjects.${cls.subject}` as `teacher.createClass.subjects.${string}`)
                : cls.subject}
              {cls.teacherName && ` · ${cls.teacherName}`}
            </p>

            {(cls.grade || cls.level) && (
              <p className="text-muted-foreground">
                {cls.grade && (GRADE_KEYS.has(cls.grade)
                  ? t(`teacher.createClass.grades.${cls.grade}` as `teacher.createClass.grades.${number}`)
                  : cls.grade)}
                {cls.grade && cls.level && " · "}
                {cls.level && t(`classLevels.${cls.level}` as `classLevels.${string}`)}
              </p>
            )}

            <p>
              <span className="font-medium">{t(`days.${cls.dayOfWeek}` as `days.${number}`)}</span>
              {dateLabel && <span className="text-muted-foreground"> — {dateLabel}</span>}
              <span className="text-muted-foreground">
                {" · "}{cls.startTime}–{endTime} · {cls.duration} {t("common.minutes")}
              </span>
            </p>

            <p className="text-muted-foreground">
              {cls.maxCapacity !== null ? `${cls.enrollmentCount}/${cls.maxCapacity}` : cls.enrollmentCount}{" "}
              {cls.enrollmentCount === 1 ? t("common.student") : t("common.students")}
            </p>

            {isCancelled && (
              <p className="text-orange-500 dark:text-orange-400 font-medium">
                {t("student.classes.cancelled")}
              </p>
            )}
          </div>

          {action && <div className="pt-2">{action}</div>}
        </div>
      </div>
    </div>
  );
}
