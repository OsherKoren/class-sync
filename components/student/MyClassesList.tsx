"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { type StudentClass } from "@/lib/types";
import { SUBJECT_KEYS, GRADE_KEYS } from "@/lib/classKeys";

function nextOccurrenceDate(dayOfWeek: number): string {
  const now = new Date();
  const daysUntil = (dayOfWeek - now.getDay() + 7) % 7 || 7;
  const next = new Date(now);
  next.setDate(now.getDate() + daysUntil);
  return next.toISOString().slice(0, 10);
}

export function MyClassesList({
  classes,
  cancelledSessions,
  onCancelClick,
}: {
  classes: StudentClass[];
  cancelledSessions: Map<string, Set<string>>;
  onCancelClick: (cls: StudentClass, date: string) => void;
}) {
  const t = useTranslations();

  return (
    <div className="grid gap-4">
      {classes.map((cls) => {
        const nextDate = nextOccurrenceDate(cls.dayOfWeek);
        const isCancelled = cancelledSessions.get(cls.classId)?.has(nextDate) ?? false;
        return (
          <Card key={cls.classId}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {cls.name}
                    {isCancelled && (
                      <span className="text-xs font-normal bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-0.5 rounded-full">
                        {t("student.classes.nextCancelled")}
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {SUBJECT_KEYS.has(cls.subject)
                      ? t(`teacher.createClass.subjects.${cls.subject}` as `teacher.createClass.subjects.${string}`)
                      : cls.subject}
                    {cls.teacherName && <span className="block">{cls.teacherName}</span>}
                  </CardDescription>
                </div>
                <div className="text-right text-sm space-y-1">
                  <p className="font-medium">{t(`classTypes.${cls.type}` as `classTypes.${string}`)}</p>
                  {(cls.grade || cls.level) && (
                    <p className="text-muted-foreground">
                      {cls.grade && (
                        <span>
                          {GRADE_KEYS.has(cls.grade)
                            ? t(`teacher.createClass.grades.${cls.grade}` as `teacher.createClass.grades.${number}`)
                            : cls.grade}
                        </span>
                      )}
                      {cls.grade && cls.level && " · "}
                      {cls.level && t(`classLevels.${cls.level}` as `classLevels.${string}`)}
                    </p>
                  )}
                  <p className="text-muted-foreground">
                    {t(`days.${cls.dayOfWeek}` as `days.${number}`)} {cls.startTime}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {cls.maxCapacity !== null
                  ? `${cls.enrollmentCount}/${cls.maxCapacity}`
                  : cls.enrollmentCount}{" "}
                {cls.enrollmentCount === 1 ? t("common.student") : t("common.students")}{" "}
                enrolled · {cls.duration} {t("common.minutesPerSession")}
              </p>
              <Button variant="outline" size="sm" onClick={() => onCancelClick(cls, nextDate)}>
                {t("student.classes.cancelNextSession")}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
