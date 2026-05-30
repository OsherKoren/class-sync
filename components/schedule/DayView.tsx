"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { SUBJECT_KEYS } from "@/lib/classKeys";
import { Button } from "@/components/ui/button";
import { type ClassItem } from "@/lib/types";
import { toMinutes, gridRange } from "./calendarUtils";
import { ClassDetailSheet } from "./ClassDetailSheet";

const HOUR_HEIGHT = 80;

function endTimeStr(startTime: string, duration: number): string {
  const total = toMinutes(startTime) + duration;
  return `${Math.floor(total / 60).toString().padStart(2, "0")}:${(total % 60).toString().padStart(2, "0")}`;
}

export function DayView({ classes, teacherName, allowCreate }: { classes: ClassItem[]; teacherName: string | null; allowCreate?: boolean }) {
  const t = useTranslations();
  const router = useRouter();
  const todayDow = new Date().getDay();
  const [selectedDay, setSelectedDay] = useState(todayDow);
  const [selected, setSelected] = useState<ClassItem | null>(null);
  const { startHour, endHour } = gridRange(classes);
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const dayClasses = classes.filter((c) => c.dayOfWeek === selectedDay);

  function handleCellClick(e: React.MouseEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("button")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const raw = startHour * 60 + (y / HOUR_HEIGHT) * 60;
    const snapped = Math.max(0, Math.min(23 * 60 + 45, Math.round(raw / 15) * 15));
    const h = Math.floor(snapped / 60).toString().padStart(2, "0");
    const m = (snapped % 60).toString().padStart(2, "0");
    router.push(`/teacher/classes/new?day=${selectedDay}&startTime=${h}:${m}`);
  }

  return (
    <>
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1" dir="ltr">
        {[0, 1, 2, 3, 4, 5, 6].map((day) => (
          <button key={day} onClick={() => setSelectedDay(day)}
            className={cn("px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition-colors",
              selectedDay === day ? "bg-primary text-primary-foreground"
              : day === todayDow ? "bg-primary/10 text-primary hover:bg-primary/20 active:bg-primary/30"
              : "hover:bg-accent active:bg-accent/80")}>
            {t(`days.${day}` as `days.${number}`)}
          </button>
        ))}
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

          <div
            className={cn("relative", allowCreate && "cursor-pointer")}
            style={{ height: hours.length * HOUR_HEIGHT }}
            onClick={allowCreate ? handleCellClick : undefined}
          >
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
                <button
                  key={cls.id}
                  onClick={() => setSelected(cls)}
                  style={{ top, height }}
                  className="absolute inset-x-2 rounded-md bg-primary/20 border border-primary/50 px-3 py-2 overflow-hidden hover:bg-primary/30 active:bg-primary/40 transition-colors text-left cursor-pointer"
                >
                  <p className="text-sm font-semibold leading-tight truncate">{cls.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {SUBJECT_KEYS.has(cls.subject) ? t(`teacher.createClass.subjects.${cls.subject}` as `teacher.createClass.subjects.${string}`) : cls.subject}
                    {teacherName && ` · ${teacherName}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {cls.startTime}–{endTimeStr(cls.startTime, cls.duration)}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <ClassDetailSheet
        open={!!selected}
        onClose={() => setSelected(null)}
        cls={selected}
        action={selected && (
          <Link href={`/teacher/classes/${selected.id}`} onClick={() => setSelected(null)}>
            <Button className="w-full">{t("schedule.openClass")}</Button>
          </Link>
        )}
      />
    </>
  );
}
