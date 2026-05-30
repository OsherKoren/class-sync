"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { SUBJECT_KEYS } from "@/lib/classKeys";
import { Button } from "@/components/ui/button";
import { type StudentClass } from "@/lib/types";
import { toMinutes, gridRange } from "@/components/schedule/calendarUtils";
import { ClassDetailSheet } from "@/components/schedule/ClassDetailSheet";

const HOUR_HEIGHT = 180;
const DAYS = [0, 1, 2, 3, 4, 5, 6] as const;

type SheetTarget = { cls: StudentClass; date: string };

function getWeekStart(offset: number): Date {
  const today = new Date();
  const d = new Date(today);
  d.setDate(today.getDate() - today.getDay() + offset * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

function slotDate(weekStart: Date, dayOfWeek: number): string {
  const d = new Date(weekStart);
  d.setDate(weekStart.getDate() + dayOfWeek);
  return d.toISOString().slice(0, 10);
}

function endTimeStr(startTime: string, duration: number): string {
  const total = toMinutes(startTime) + duration;
  return `${Math.floor(total / 60).toString().padStart(2, "0")}:${(total % 60).toString().padStart(2, "0")}`;
}

export function StudentWeekView({
  classes,
  cancelledSessions,
  onCancelClick,
  readOnly = false,
}: {
  classes: StudentClass[];
  cancelledSessions: Map<string, Set<string>>;
  onCancelClick: (cls: StudentClass, date: string) => void;
  readOnly?: boolean;
}) {
  const t = useTranslations();
  const [weekOffset, setWeekOffset] = useState(0);
  const [sheetTarget, setSheetTarget] = useState<SheetTarget | null>(null);
  const weekStart = getWeekStart(weekOffset);
  const todayStr = new Date().toISOString().slice(0, 10);
  const { startHour, endHour } = gridRange(classes);
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const weekEndDate = new Date(weekStart);
  weekEndDate.setDate(weekStart.getDate() + 6);

  const sheetIsCancelled = sheetTarget
    ? (cancelledSessions.get(sheetTarget.cls.classId)?.has(sheetTarget.date) ?? false)
    : false;

  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setWeekOffset((o) => o - 1)} className="px-2 py-1 rounded hover:bg-accent active:bg-accent/80 text-sm">←</button>
        <span className="text-sm text-muted-foreground">
          {weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          {" – "}
          {weekEndDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
        </span>
        <button onClick={() => setWeekOffset((o) => o + 1)} className="px-2 py-1 rounded hover:bg-accent active:bg-accent/80 text-sm">→</button>
        {weekOffset !== 0 && (
          <button onClick={() => setWeekOffset(0)} className="text-xs text-primary hover:underline">
            {t("student.classes.thisWeek")}
          </button>
        )}
      </div>

      <div className="overflow-x-auto border rounded-lg" dir="ltr">
        <div className="min-w-[700px]">
          <div className="grid grid-cols-[48px_repeat(7,1fr)] border-b bg-muted/30">
            <div />
            {DAYS.map((day) => {
              const dateStr = slotDate(weekStart, day);
              const d = new Date(dateStr + "T12:00:00");
              return (
                <div key={day} className={cn("py-2 text-center text-xs font-medium border-l", dateStr === todayStr && "text-primary font-semibold")}>
                  <div>{t(`days.${day}` as `days.${number}`)}</div>
                  <div className="text-muted-foreground font-normal">{d.getDate()}/{d.getMonth() + 1}</div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-[48px_repeat(7,1fr)]">
            <div>
              {hours.map((h) => (
                <div key={h} style={{ height: HOUR_HEIGHT }} className="text-xs text-muted-foreground flex items-start pt-1 justify-end pr-2 border-b">
                  {`${h.toString().padStart(2, "0")}:00`}
                </div>
              ))}
            </div>

            {DAYS.map((day) => {
              const dateStr = slotDate(weekStart, day);
              const dayClasses = classes.filter((c) => c.dayOfWeek === day);
              return (
                <div key={day} className={cn("border-l relative", dateStr === todayStr && "bg-primary/5")} style={{ height: hours.length * HOUR_HEIGHT }}>
                  {hours.map((_, i) => (
                    <div key={i} style={{ top: i * HOUR_HEIGHT }} className="absolute w-full border-b border-border/40" />
                  ))}
                  {dayClasses.map((cls) => {
                    const isCancelled = cancelledSessions.get(cls.classId)?.has(dateStr) ?? false;
                    const top = (toMinutes(cls.startTime) - startHour * 60) * (HOUR_HEIGHT / 60);
                    const height = cls.duration * (HOUR_HEIGHT / 60);
                    return (
                      <button
                        key={cls.classId}
                        style={{ top, height }}
                        onClick={() => setSheetTarget({ cls, date: dateStr })}
                        className={cn(
                          "absolute inset-x-0.5 rounded text-left px-1.5 py-1 overflow-hidden transition-colors border cursor-pointer",
                          isCancelled
                            ? "bg-muted/50 border-border/30 opacity-60 hover:opacity-80 active:opacity-90"
                            : "bg-primary/20 border-primary/50 hover:bg-primary/35 active:bg-primary/45"
                        )}
                      >
                        <p className={cn("text-xs font-semibold leading-none truncate", isCancelled && "line-through")}>{cls.name}</p>
                        <p className="text-xs text-muted-foreground leading-none truncate mt-1">
                          {SUBJECT_KEYS.has(cls.subject) ? t(`teacher.createClass.subjects.${cls.subject}` as `teacher.createClass.subjects.${string}`) : cls.subject}
                        </p>
                        <p className="text-xs text-muted-foreground leading-none mt-1">{cls.startTime}–{endTimeStr(cls.startTime, cls.duration)}</p>
                        {isCancelled && (
                          <p className="text-xs text-orange-500 dark:text-orange-400 leading-none mt-1">{t("student.classes.cancelled")}</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <ClassDetailSheet
        open={!!sheetTarget}
        onClose={() => setSheetTarget(null)}
        cls={sheetTarget?.cls ?? null}
        date={sheetTarget?.date}
        isCancelled={sheetIsCancelled}
        action={sheetTarget && !readOnly && !sheetIsCancelled && (
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => {
              const target = sheetTarget;
              setSheetTarget(null);
              onCancelClick(target.cls, target.date);
            }}
          >
            {t("schedule.cancelSession")}
          </Button>
        )}
      />
    </>
  );
}
