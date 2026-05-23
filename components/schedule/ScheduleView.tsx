"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GRADE_KEYS, SUBJECT_KEYS } from "@/lib/classKeys";
import { type ClassItem } from "@/lib/types";
import { WeekView } from "./WeekView";
import { DayView } from "./DayView";

type ViewMode = "list" | "week" | "day";

export function ScheduleView({
  classes,
  teacherName,
}: {
  classes: ClassItem[];
  teacherName: string | null;
}) {
  const t = useTranslations();
  const [view, setView] = useState<ViewMode>("week");

  const viewLabels: Record<ViewMode, string> = {
    list: t("schedule.listView"),
    week: t("schedule.weekView"),
    day: t("schedule.dayView"),
  };

  return (
    <div>
      <div className="flex border rounded-md overflow-hidden w-fit mb-6 divide-x">
        {(["list", "week", "day"] as ViewMode[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={cn(
              "px-4 py-1.5 text-sm transition-colors",
              view === v ? "bg-primary text-primary-foreground" : "hover:bg-accent"
            )}
          >
            {viewLabels[v]}
          </button>
        ))}
      </div>

      {view === "list" && (
        <div className="grid gap-4">
          {classes.map((cls) => (
            <Link key={cls.id} href={`/teacher/classes/${cls.id}`}>
              <Card className="hover:bg-accent transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{cls.name}</CardTitle>
                      <CardDescription>
                        {SUBJECT_KEYS.has(cls.subject) ? t(`teacher.createClass.subjects.${cls.subject}` as `teacher.createClass.subjects.${string}`) : cls.subject}
                        {teacherName && <span className="block">{teacherName}</span>}
                      </CardDescription>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-medium">
                        {t(`classTypes.${cls.type}` as `classTypes.${string}`)}
                      </p>
                      {(cls.level || cls.grade) && (
                        <p className="text-muted-foreground">
                          {cls.grade && (GRADE_KEYS.has(cls.grade) ? t(`teacher.createClass.grades.${cls.grade}` as `teacher.createClass.grades.${number}`) : cls.grade)}
                          {cls.grade && cls.level && " · "}
                          {cls.level && t(`classLevels.${cls.level}` as `classLevels.${string}`)}
                        </p>
                      )}
                      <p className="text-muted-foreground">
                        {t(`days.${cls.dayOfWeek}` as `days.${number}`)} at {cls.startTime}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {cls.enrollmentCount}{" "}
                    {cls.enrollmentCount === 1 ? t("common.student") : t("common.students")}{" "}
                    enrolled · {cls.duration} {t("common.minutesPerSession")}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {view === "week" && <WeekView classes={classes} />}
      {view === "day" && <DayView classes={classes} teacherName={teacherName} />}
    </div>
  );
}
