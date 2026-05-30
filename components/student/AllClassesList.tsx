"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SUBJECT_KEYS, GRADE_KEYS } from "@/lib/classKeys";

type OpenClass = {
  id: string;
  name: string;
  subject: string;
  type: string;
  level: string | null;
  grade: string | null;
  dayOfWeek: number;
  startTime: string;
  duration: number;
  isOpen: boolean;
  maxCapacity: number | null;
  enrollmentCount: number;
  spotsLeft: number | null;
  teacherName: string | null;
};

export function AllClassesList({
  classes,
  enrolledIds,
  requesting,
  requested,
  rejectedIds,
  rejectedReasons,
  cancellingRequest,
  error,
  onRequest,
  onCancelRequest,
}: {
  classes: OpenClass[];
  enrolledIds: Set<string>;
  requesting: string | null;
  requested: Set<string>;
  rejectedIds: Set<string>;
  rejectedReasons: Map<string, string | null>;
  cancellingRequest: string | null;
  error: string;
  onRequest: (classId: string) => void;
  onCancelRequest: (classId: string) => void;
}) {
  const t = useTranslations();

  return (
    <div className="grid gap-4">
      {error && <p className="text-sm text-destructive">{error}</p>}
      {classes.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">{t("student.classes.noClasses")}</p>
          </CardContent>
        </Card>
      ) : (
        classes.map((cls) => {
          const isEnrolled = enrolledIds.has(cls.id);
          return (
            <Card key={cls.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{cls.name}</CardTitle>
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
                    {cls.spotsLeft !== null && (
                      <p className={cn("text-xs font-medium",
                        cls.spotsLeft === 0 ? "text-destructive"
                        : cls.spotsLeft <= 2 ? "text-orange-500"
                        : "text-muted-foreground")}>
                        {cls.spotsLeft === 0
                          ? t("student.classes.classFull")
                          : t("student.classes.spotsLeft", { count: cls.spotsLeft })}
                      </p>
                    )}
                    {!cls.isOpen && (
                      <span className="inline-block text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                        {t("student.classes.closedBadge")}
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {cls.maxCapacity !== null
                      ? `${cls.enrollmentCount}/${cls.maxCapacity}`
                      : cls.enrollmentCount}{" "}
                    {cls.enrollmentCount === 1 ? t("common.student") : t("common.students")}{" "}
                    enrolled · {cls.duration} {t("common.minutesPerSession")}
                  </p>
                  {isEnrolled ? (
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      {t("student.classes.enrolled")}
                    </span>
                  ) : requested.has(cls.id) ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{t("student.classes.requested")}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={cancellingRequest === cls.id}
                        onClick={() => onCancelRequest(cls.id)}
                      >
                        {cancellingRequest === cls.id ? "…" : t("student.classes.cancelRequest")}
                      </Button>
                    </div>
                  ) : rejectedIds.has(cls.id) ? (
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 text-xs rounded-full">
                        {t("student.dashboard.rejectedStatus")}
                      </span>
                      <Button
                        onClick={() => onRequest(cls.id)}
                        disabled={requesting === cls.id || !cls.isOpen}
                        variant="outline"
                        size="sm"
                      >
                        {requesting === cls.id ? t("student.classes.requesting") : t("student.classes.requestAgain")}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => onRequest(cls.id)}
                      disabled={requesting === cls.id || !cls.isOpen}
                      variant={cls.isOpen ? "default" : "outline"}
                      size="sm"
                    >
                      {requesting === cls.id ? t("student.classes.requesting") : t("student.classes.request")}
                    </Button>
                  )}
                </div>
                {rejectedIds.has(cls.id) && rejectedReasons.get(cls.id) && (
                  <p className="text-xs text-muted-foreground border-t pt-2">
                    {t("student.dashboard.rejectedReason", { reason: rejectedReasons.get(cls.id) ?? "" })}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
