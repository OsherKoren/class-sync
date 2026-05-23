"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { GRADE_KEYS, SUBJECT_KEYS } from "@/lib/classKeys";
import { type ClassItem } from "@/lib/types";
import { toMinutes, gridRange } from "./calendarUtils";

const DAYS = [0, 1, 2, 3, 4, 5, 6] as const;
const HOUR_HEIGHT = 96; // 96px/hr so a 60-min class = 96px, fitting all detail lines

function endTimeStr(startTime: string, duration: number): string {
  const total = toMinutes(startTime) + duration;
  return `${Math.floor(total / 60).toString().padStart(2, "0")}:${(total % 60).toString().padStart(2, "0")}`;
}

export function WeekView({ classes }: { classes: ClassItem[] }) {
  const t = useTranslations();
  const { startHour, endHour } = gridRange(classes);
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const todayDow = new Date().getDay();

  return (
    <div className="overflow-x-auto border rounded-lg" dir="ltr">
      <div className="min-w-[700px]">
        {/* Day header */}
        <div className="grid grid-cols-[48px_repeat(7,1fr)] border-b bg-muted/30">
          <div />
          {DAYS.map((day) => (
            <div
              key={day}
              className={cn(
                "py-2 text-center text-xs font-medium border-l",
                day === todayDow && "text-primary font-semibold"
              )}
            >
              {t(`days.${day}` as `days.${number}`)}
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div className="grid grid-cols-[48px_repeat(7,1fr)]">
          {/* Time axis */}
          <div>
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

          {/* Day columns */}
          {DAYS.map((day) => {
            const dayClasses = classes.filter((c) => c.dayOfWeek === day);
            return (
              <div
                key={day}
                className={cn("border-l relative", day === todayDow && "bg-primary/5")}
                style={{ height: hours.length * HOUR_HEIGHT }}
              >
                {hours.map((_, i) => (
                  <div key={i} style={{ top: i * HOUR_HEIGHT }} className="absolute w-full border-b border-border/40" />
                ))}
                {dayClasses.map((cls) => {
                  const top = (toMinutes(cls.startTime) - startHour * 60) * (HOUR_HEIGHT / 60);
                  const height = Math.max(cls.duration * (HOUR_HEIGHT / 60), 96);
                  return (
                    <Link
                      key={cls.id}
                      href={`/teacher/classes/${cls.id}`}
                      style={{ top, height }}
                      className="absolute inset-x-0.5 rounded bg-primary/20 border border-primary/50 px-1.5 py-1 overflow-hidden hover:bg-primary/35 transition-colors"
                    >
                      <p className="text-xs font-semibold leading-none truncate">{cls.name}</p>
                      <p className="text-xs text-muted-foreground leading-none truncate mt-1">{SUBJECT_KEYS.has(cls.subject) ? t(`teacher.createClass.subjects.${cls.subject}` as `teacher.createClass.subjects.${string}`) : cls.subject}</p>
                      <p className="text-xs text-muted-foreground leading-none mt-1">
                        {t(`classTypes.${cls.type}` as `classTypes.${string}`)}
                      </p>
                      {(cls.grade || cls.level) && (
                        <p className="text-xs text-muted-foreground leading-none truncate mt-1">
                          {cls.grade && (GRADE_KEYS.has(cls.grade) ? t(`teacher.createClass.grades.${cls.grade}` as `teacher.createClass.grades.${number}`) : cls.grade)}
                          {cls.grade && cls.level && " · "}
                          {cls.level && t(`classLevels.${cls.level}` as `classLevels.${string}`)}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground leading-none mt-1">
                        {cls.startTime}–{endTimeStr(cls.startTime, cls.duration)}
                      </p>
                      <p className="text-xs text-muted-foreground leading-none mt-1">
                        {cls.enrollmentCount}{" "}
                        {cls.enrollmentCount === 1 ? t("common.student") : t("common.students")}
                      </p>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
