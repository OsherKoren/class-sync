"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { GRADE_KEYS, SUBJECT_KEYS } from "@/lib/classKeys";
import { type ClassItem } from "@/lib/types";
import { toMinutes, gridRange } from "./calendarUtils";

const HOUR_HEIGHT = 80; // taller rows for the single-column view

function endTimeStr(startTime: string, duration: number): string {
  const total = toMinutes(startTime) + duration;
  return `${Math.floor(total / 60).toString().padStart(2, "0")}:${(total % 60).toString().padStart(2, "0")}`;
}

export function DayView({
  classes,
  teacherName,
}: {
  classes: ClassItem[];
  teacherName: string | null;
}) {
  const t = useTranslations();
  const todayDow = new Date().getDay();
  const [selectedDay, setSelectedDay] = useState(todayDow);
  const { startHour, endHour } = gridRange(classes);
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const dayClasses = classes.filter((c) => c.dayOfWeek === selectedDay);

  return (
    <div>
      {/* Day selector */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1" dir="ltr">
        {[0, 1, 2, 3, 4, 5, 6].map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition-colors",
              selectedDay === day
                ? "bg-primary text-primary-foreground"
                : day === todayDow
                ? "bg-primary/10 text-primary hover:bg-primary/20"
                : "hover:bg-accent"
            )}
          >
            {t(`days.${day}` as `days.${number}`)}
          </button>
        ))}
      </div>

      {/* Time grid */}
      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-[48px_1fr]" dir="ltr">
          {/* Time axis */}
          <div className="border-r">
            {hours.map((h) => (
              <div
                key={h}
                style={{ height: HOUR_HEIGHT }}
                className="text-xs text-muted-foreground flex items-start pt-1 justify-end pr-2 border-b"
              >
                {`${h.toString().padStart(2, "0")}:00`}
              </div>
            ))}
          </div>

          {/* Day column */}
          <div className="relative" style={{ height: hours.length * HOUR_HEIGHT }}>
            {hours.map((_, i) => (
              <div key={i} style={{ top: i * HOUR_HEIGHT }} className="absolute w-full border-b border-border/40" />
            ))}

            {dayClasses.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">{t("schedule.noClassesThisDay")}</p>
              </div>
            )}

            {dayClasses.map((cls) => {
              const top = (toMinutes(cls.startTime) - startHour * 60) * (HOUR_HEIGHT / 60);
              const height = Math.max(cls.duration * (HOUR_HEIGHT / 60), 90);
              return (
                <Link
                  key={cls.id}
                  href={`/teacher/classes/${cls.id}`}
                  style={{ top, height }}
                  className="absolute inset-x-2 rounded-md bg-primary/20 border border-primary/50 px-3 py-2 overflow-hidden hover:bg-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-tight truncate">{cls.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {SUBJECT_KEYS.has(cls.subject) ? t(`teacher.createClass.subjects.${cls.subject}` as `teacher.createClass.subjects.${string}`) : cls.subject}
                        {teacherName && ` · ${teacherName}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-medium">
                        {t(`classTypes.${cls.type}` as `classTypes.${string}`)}
                      </p>
                      {(cls.grade || cls.level) && (
                        <p className="text-xs text-muted-foreground">
                          {cls.grade && (GRADE_KEYS.has(cls.grade) ? t(`teacher.createClass.grades.${cls.grade}` as `teacher.createClass.grades.${number}`) : cls.grade)}
                          {cls.grade && cls.level && " · "}
                          {cls.level && t(`classLevels.${cls.level}` as `classLevels.${string}`)}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {cls.startTime}–{endTimeStr(cls.startTime, cls.duration)} · {cls.duration}{" "}
                    {t("common.minutes")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {cls.maxCapacity !== null
                      ? `${cls.enrollmentCount}/${cls.maxCapacity}`
                      : cls.enrollmentCount}{" "}
                    {cls.enrollmentCount === 1 ? t("common.student") : t("common.students")} enrolled
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
