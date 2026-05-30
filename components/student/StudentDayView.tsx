"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { SUBJECT_KEYS } from "@/lib/classKeys";
import { Button } from "@/components/ui/button";
import { type StudentClass } from "@/lib/types";
import { toMinutes, gridRange } from "@/components/schedule/calendarUtils";
import { ClassDetailSheet } from "@/components/schedule/ClassDetailSheet";

const HOUR_HEIGHT = 80;

type SheetTarget = { cls: StudentClass; date: string };

function endTimeStr(startTime: string, duration: number): string {
  const total = toMinutes(startTime) + duration;
  return `${Math.floor(total / 60).toString().padStart(2, "0")}:${(total % 60).toString().padStart(2, "0")}`;
}

function weekDayDate(dayOfWeek: number, weekOffset: number): string {
  const today = new Date();
  const d = new Date(today);
  d.setDate(today.getDate() - today.getDay() + weekOffset * 7 + dayOfWeek);
  return d.toISOString().slice(0, 10);
}

export function StudentDayView({
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
  const todayDow = new Date().getDay();
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDay, setSelectedDay] = useState(todayDow);
  const [weekOffset, setWeekOffset] = useState(0);
  const [sheetTarget, setSheetTarget] = useState<SheetTarget | null>(null);
  const { startHour, endHour } = gridRange(classes);
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const dayClasses = classes.filter((c) => c.dayOfWeek === selectedDay);
  const selectedDate = weekDayDate(selectedDay, weekOffset);

  const sheetIsCancelled = sheetTarget
    ? (cancelledSessions.get(sheetTarget.cls.classId)?.has(sheetTarget.date) ?? false)
    : false;

  return (
    <>
      <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1" dir="ltr">
        <button onClick={() => setWeekOffset((o) => o - 1)} className="px-2 py-1 rounded hover:bg-accent active:bg-accent/80 text-sm shrink-0">←</button>
        {[0, 1, 2, 3, 4, 5, 6].map((day) => {
          const dateStr = weekDayDate(day, weekOffset);
          const d = new Date(dateStr + "T12:00:00");
          return (
            <button key={day} onClick={() => setSelectedDay(day)}
              className={cn("px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition-colors",
                selectedDay === day ? "bg-primary text-primary-foreground"
                : dateStr === todayStr ? "bg-primary/10 text-primary hover:bg-primary/20 active:bg-primary/30"
                : "hover:bg-accent active:bg-accent/80")}>
              <span className="block">{t(`days.${day}` as `days.${number}`)}</span>
              <span className="block text-xs opacity-70">{d.getDate()}/{d.getMonth() + 1}</span>
            </button>
          );
        })}
        <button onClick={() => setWeekOffset((o) => o + 1)} className="px-2 py-1 rounded hover:bg-accent active:bg-accent/80 text-sm shrink-0">→</button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-[48px_1fr]" dir="ltr">
          <div className="border-r">
            {hours.map((h) => (
              <div key={h} style={{ height: HOUR_HEIGHT }} className="text-xs text-muted-foreground flex items-start pt-1 justify-end pr-2 border-b">
                {`${h.toString().padStart(2, "0")}:00`}
              </div>
            ))}
          </div>
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
              const isCancelled = cancelledSessions.get(cls.classId)?.has(selectedDate) ?? false;
              const top = (toMinutes(cls.startTime) - startHour * 60) * (HOUR_HEIGHT / 60);
              const height = Math.max(cls.duration * (HOUR_HEIGHT / 60), 90);
              return (
                <button
                  key={cls.classId}
                  style={{ top, height }}
                  onClick={() => setSheetTarget({ cls, date: selectedDate })}
                  className={cn(
                    "absolute inset-x-2 rounded-md text-left px-3 py-2 overflow-hidden transition-colors border cursor-pointer",
                    isCancelled
                      ? "bg-muted/50 border-border/30 opacity-60 hover:opacity-80 active:opacity-90"
                      : "bg-primary/20 border-primary/50 hover:bg-primary/30 active:bg-primary/40"
                  )}
                >
                  <p className={cn("text-sm font-semibold leading-tight truncate", isCancelled && "line-through")}>{cls.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {SUBJECT_KEYS.has(cls.subject) ? t(`teacher.createClass.subjects.${cls.subject}` as `teacher.createClass.subjects.${string}`) : cls.subject}
                    {cls.teacherName && ` · ${cls.teacherName}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {cls.startTime}–{endTimeStr(cls.startTime, cls.duration)}
                  </p>
                  {isCancelled && (
                    <p className="text-xs text-orange-500 dark:text-orange-400 mt-1">{t("student.classes.cancelled")}</p>
                  )}
                </button>
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
