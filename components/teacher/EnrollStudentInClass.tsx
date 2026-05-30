"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { enrollStudent } from "@/lib/actions/guardian";
import { getTeacherClasses } from "@/lib/actions/class";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { SUBJECT_KEYS, GRADE_KEYS } from "@/lib/classKeys";

type ClassOption = {
  id: string;
  name: string;
  subject: string;
  type: string;
  level: string | null;
  grade: string | null;
  dayOfWeek: number;
  startTime: string;
  duration: number;
  maxCapacity: number | null;
  enrollmentCount: number;
};

function CapacityDot({
  enrolled,
  max,
  t,
}: {
  enrolled: number;
  max: number | null;
  t: ReturnType<typeof useTranslations>;
}) {
  if (max === null) {
    return (
      <span className="text-xs text-muted-foreground">
        {t("teacher.students.enrolledCount", { count: enrolled })}
      </span>
    );
  }
  const full = enrolled >= max;
  const nearly = enrolled / max >= 0.75;
  return (
    <span className={cn(
      "text-xs font-medium tabular-nums",
      full ? "text-destructive" : nearly ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"
    )}>
      <span className={cn(
        "inline-block w-1.5 h-1.5 rounded-full me-1 align-middle",
        full ? "bg-destructive" : nearly ? "bg-amber-500" : "bg-green-500"
      )} />
      {enrolled} / {max}
    </span>
  );
}

export function EnrollStudentInClass({
  studentId,
  studentName,
}: {
  studentId: string;
  studentName: string;
}) {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [error, setError] = useState("");
  const t = useTranslations();

  useEffect(() => {
    getTeacherClasses().then((result) => {
      if ("data" in result) setClasses(result.data);
    });
  }, []);

  async function handleEnroll() {
    if (!selectedClassId) return;
    setEnrolling(true);
    setError("");
    const result = await enrollStudent(studentId, selectedClassId);
    if ("error" in result) {
      setError(result.error);
    } else {
      setEnrolled(true);
      setSelectedClassId("");
    }
    setEnrolling(false);
  }

  function subjectLabel(s: string) {
    return SUBJECT_KEYS.has(s)
      ? t(`teacher.createClass.subjects.${s}` as `teacher.createClass.subjects.${string}`)
      : s;
  }

  function levelLabel(l: string) {
    return t(`classLevels.${l}` as `classLevels.${string}`);
  }

  function gradeLabel(g: string) {
    return GRADE_KEYS.has(g)
      ? t(`teacher.createClass.grades.${g}` as `teacher.createClass.grades.${number}`)
      : g;
  }

  function classSubtitle(c: ClassOption) {
    const parts: string[] = [subjectLabel(c.subject)];
    if (c.grade) parts.push(gradeLabel(c.grade));
    if (c.level) parts.push(levelLabel(c.level));
    return parts.join(" · ");
  }

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("teacher.studentDetail.enrollSection")}</CardTitle>
        <CardDescription>{t("teacher.studentDetail.enrollDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {enrolled && (
          <p className="text-sm text-green-600 dark:text-green-400">
            {t("teacher.studentDetail.enrolledSuccess", {
              name: studentName,
              className: selectedClass?.name ?? "",
            })}
          </p>
        )}

        {classes.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("teacher.students.noClasses")}</p>
        ) : (
          <>
            <div className="max-h-64 overflow-y-auto space-y-1 rounded-lg border p-1">
              {classes.map((c) => {
                const isSelected = c.id === selectedClassId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { setSelectedClassId(c.id); setEnrolled(false); setError(""); }}
                    className={cn(
                      "w-full text-start rounded-md px-3 py-2.5 transition-colors",
                      isSelected ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-sm leading-tight">{c.name}</p>
                        <p className={cn(
                          "text-xs mt-0.5 truncate",
                          isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}>
                          {classSubtitle(c)}
                        </p>
                      </div>
                      <div className="text-end shrink-0 space-y-0.5">
                        <p className={cn(
                          "text-xs font-medium",
                          isSelected ? "text-primary-foreground/90" : ""
                        )}>
                          {t(`days.${c.dayOfWeek}` as `days.${number}`)} · {c.startTime}
                        </p>
                        <div className={isSelected ? "opacity-80" : ""}>
                          <CapacityDot enrolled={c.enrollmentCount} max={c.maxCapacity} t={t} />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              className="w-full"
              onClick={handleEnroll}
              disabled={enrolling || !selectedClassId}
            >
              {enrolling
                ? t("teacher.students.enrolling")
                : selectedClass
                  ? t("teacher.students.enrollInClass", { className: selectedClass.name })
                  : t("teacher.students.enroll")}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
