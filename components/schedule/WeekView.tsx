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

const DAYS = [0, 1, 2, 3, 4, 5, 6] as const;
const HOUR_HEIGHT = 180;

function endTimeStr(startTime: string, duration: number): string {
  const total = toMinutes(startTime) + duration;
  return `${Math.floor(total / 60).toString().padStart(2, "0")}:${(total % 60).toString().padStart(2, "0")}`;
}

export function WeekView({ classes, allowCreate }: { classes: ClassItem[]; teacherName?: string | null; allowCreate?: boolean }) {
  const t = useTranslations();
  const router = useRouter();
  const [selected, setSelected] = useState<ClassItem | null>(null);
  const { startHour, endHour } = gridRange(classes);
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const todayDow = new Date().getDay();

  function handleCellClick(e: React.MouseEvent<HTMLDivElement>, day: number) {
    if ((e.target as HTMLElement).closest("button")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const raw = startHour * 60 + (y / HOUR_HEIGHT) * 60;
    const snapped = Math.max(0, Math.min(23 * 60 + 45, Math.round(raw / 15) * 15));
    const h = Math.floor(snapped / 60).toString().padStart(2, "0");
    const m = (snapped % 60).toString().padStart(2, "0");
    router.push(`/teacher/classes/new?day=${day}&startTime=${h}:${m}`);
  }

  return (
    <>
      <div className="overflow-x-auto border rounded-lg" dir="ltr">
        <div className="min-w-[700px]">
          <div className="grid grid-cols-[48px_repeat(7,1fr)] border-b bg-muted/30">
            <div />
            {DAYS.map((day) => (
              <div key={day} className={cn("py-2 text-center text-xs font-medium border-l", day === todayDow && "text-primary font-semibold")}>
                {t(`days.${day}` as `days.${number}`)}
              </div>
            ))}
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
              const dayClasses = classes.filter((c) => c.dayOfWeek === day);
              return (
                <div
                  key={day}
                  className={cn("border-l relative", day === todayDow && "bg-primary/5", allowCreate && "cursor-pointer")}
                  style={{ height: hours.length * HOUR_HEIGHT }}
                  onClick={allowCreate ? (e) => handleCellClick(e, day) : undefined}
                >
                  {hours.map((_, i) => (
                    <div key={i} style={{ top: i * HOUR_HEIGHT }} className="absolute w-full border-b border-border/40" />
                  ))}
                  {dayClasses.map((cls) => {
                    const top = (toMinutes(cls.startTime) - startHour * 60) * (HOUR_HEIGHT / 60);
                    const height = cls.duration * (HOUR_HEIGHT / 60);
                    return (
                      <button
                        key={cls.id}
                        onClick={() => setSelected(cls)}
                        style={{ top, height }}
                        className="absolute inset-x-0.5 rounded bg-primary/20 border border-primary/50 px-1.5 py-1 overflow-hidden hover:bg-primary/35 active:bg-primary/45 transition-colors text-left cursor-pointer"
                      >
                        <p className="text-xs font-semibold leading-none truncate">{cls.name}</p>
                        <p className="text-xs text-muted-foreground leading-none truncate mt-1">
                          {SUBJECT_KEYS.has(cls.subject) ? t(`teacher.createClass.subjects.${cls.subject}` as `teacher.createClass.subjects.${string}`) : cls.subject}
                        </p>
                        <p className="text-xs text-muted-foreground leading-none mt-1">
                          {cls.startTime}–{endTimeStr(cls.startTime, cls.duration)}
                        </p>
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
