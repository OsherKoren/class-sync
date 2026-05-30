"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { requestEnrollment } from "@/lib/actions/student";
import { type StudentClass } from "@/lib/types";
import { SUBJECT_KEYS, GRADE_KEYS } from "@/lib/classKeys";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CancelSessionDialog } from "./CancelSessionDialog";
import { MyClassesList } from "./MyClassesList";
import { AllClassesList } from "./AllClassesList";
import { ClassFilters, type ClassFilterState } from "./ClassFilters";
import { StudentWeekView } from "./StudentWeekView";
import { StudentDayView } from "./StudentDayView";

type OpenClass = {
  id: string; name: string; subject: string; type: string;
  level: string | null; grade: string | null; dayOfWeek: number;
  startTime: string; duration: number; isOpen: boolean;
  maxCapacity: number | null; spotsLeft: number | null; teacherName: string | null;
};

type CancelTarget = { class: StudentClass; date: string };
type Tab = "mine" | "all";
type ViewMode = "list" | "week" | "day";

export function StudentClassesClient({
  enrolledClasses,
  openClasses,
  initialAbsences,
}: {
  enrolledClasses: StudentClass[];
  openClasses: OpenClass[];
  initialAbsences: Array<{ classId: string; date: string }>;
}) {
  const t = useTranslations();
  const [tab, setTab] = useState<Tab>("mine");
  const [view, setView] = useState<ViewMode>("week");
  const [cancelTarget, setCancelTarget] = useState<CancelTarget | null>(null);
  const [cancelledSessions, setCancelledSessions] = useState<Map<string, Set<string>>>(() => {
    const map = new Map<string, Set<string>>();
    for (const a of initialAbsences) {
      if (!map.has(a.classId)) map.set(a.classId, new Set());
      map.get(a.classId)!.add(a.date);
    }
    return map;
  });
  const [requesting, setRequesting] = useState<string | null>(null);
  const [requested, setRequested] = useState<Set<string>>(new Set());
  const [requestError, setRequestError] = useState("");
  const [filters, setFilters] = useState<ClassFilterState>({ subject: "", grade: "", level: "", dayOfWeek: "" });

  const enrolledIds = new Set(enrolledClasses.map((c) => c.classId));

  const subjectOptions = useMemo(() => {
    const subjects = [...new Set(openClasses.map((c) => c.subject))];
    return subjects.map((s) => ({ value: s, label: SUBJECT_KEYS.has(s) ? t(`teacher.createClass.subjects.${s}` as `teacher.createClass.subjects.${string}`) : s }));
  }, [openClasses, t]);

  const gradeOptions = useMemo(() => {
    const grades = [...new Set(openClasses.map((c) => c.grade).filter((g): g is string => g !== null))];
    return grades.map((g) => ({ value: g, label: GRADE_KEYS.has(g) ? t(`teacher.createClass.grades.${g}` as `teacher.createClass.grades.${string}`) : g }));
  }, [openClasses, t]);

  const levelOptions = useMemo(() => {
    const levels = [...new Set(openClasses.map((c) => c.level).filter((l): l is string => l !== null))];
    return levels.map((l) => ({ value: l, label: t(`classLevels.${l}` as `classLevels.${string}`) }));
  }, [openClasses, t]);

  const dayOptions = useMemo(() => {
    const days = [...new Set(openClasses.map((c) => c.dayOfWeek))].sort((a, b) => a - b);
    return days.map((d) => ({ value: String(d), label: t(`days.${d}` as `days.${number}`) }));
  }, [openClasses, t]);

  const filteredClasses = useMemo(() => {
    return openClasses.filter((c) => {
      if (filters.subject && c.subject !== filters.subject) return false;
      if (filters.grade && c.grade !== filters.grade) return false;
      if (filters.level && c.level !== filters.level) return false;
      if (filters.dayOfWeek && String(c.dayOfWeek) !== filters.dayOfWeek) return false;
      return true;
    });
  }, [openClasses, filters]);

  function updateFilter(key: keyof ClassFilterState, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  async function handleRequest(classId: string) {
    setRequesting(classId);
    const result = await requestEnrollment(classId);
    if ("error" in result) setRequestError(result.error);
    else setRequested((prev) => new Set([...prev, classId]));
    setRequesting(null);
  }

  function handleCancelled() {
    if (!cancelTarget) return;
    setCancelledSessions((prev) => {
      const next = new Map(prev);
      const { classId } = cancelTarget.class;
      if (!next.has(classId)) next.set(classId, new Set());
      next.get(classId)!.add(cancelTarget.date);
      return next;
    });
  }

  function openCancel(cls: StudentClass, date: string) {
    setCancelTarget({ class: cls, date });
  }

  const alternatives = openClasses.filter(
    (c) => !enrolledIds.has(c.id) && !requested.has(c.id) && c.isOpen
  );

  const viewLabels: Record<ViewMode, string> = {
    list: t("schedule.listView"),
    week: t("schedule.weekView"),
    day: t("schedule.dayView"),
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-8">
        <div className="pt-8 mb-6">
          <Link href="/student/dashboard" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">
            {t("common.backToDashboard")}
          </Link>
          <h1 className="text-3xl font-bold">{t("student.classes.pageTitle")}</h1>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex border rounded-md overflow-hidden divide-x">
            {(["mine", "all"] as Tab[]).map((tt) => (
              <button key={tt} onClick={() => setTab(tt)}
                className={cn("px-4 py-1.5 text-sm transition-colors",
                  tab === tt ? "bg-primary text-primary-foreground" : "hover:bg-accent active:bg-accent/80")}>
                {tt === "mine" ? t("student.classes.tabMine") : t("student.classes.tabAll")}
              </button>
            ))}
          </div>
          {tab === "mine" && (
            <div className="flex border rounded-md overflow-hidden divide-x">
              {(["list", "week", "day"] as ViewMode[]).map((v) => (
                <button key={v} onClick={() => setView(v)}
                  className={cn("px-4 py-1.5 text-sm transition-colors",
                    view === v ? "bg-primary text-primary-foreground" : "hover:bg-accent active:bg-accent/80")}>
                  {viewLabels[v]}
                </button>
              ))}
            </div>
          )}
        </div>

        {tab === "mine" && enrolledClasses.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-4">{t("student.classes.noEnrollments")}</p>
              <Button variant="outline" onClick={() => setTab("all")}>{t("student.classes.tabAll")}</Button>
            </CardContent>
          </Card>
        )}
        {tab === "mine" && enrolledClasses.length > 0 && view === "list" && (
          <MyClassesList classes={enrolledClasses} cancelledSessions={cancelledSessions} onCancelClick={openCancel} />
        )}
        {tab === "mine" && enrolledClasses.length > 0 && view === "week" && (
          <StudentWeekView classes={enrolledClasses} cancelledSessions={cancelledSessions} onCancelClick={openCancel} />
        )}
        {tab === "mine" && enrolledClasses.length > 0 && view === "day" && (
          <StudentDayView classes={enrolledClasses} cancelledSessions={cancelledSessions} onCancelClick={openCancel} />
        )}
        {tab === "all" && (
          <>
            <ClassFilters
              filters={filters}
              subjectOptions={subjectOptions}
              gradeOptions={gradeOptions}
              levelOptions={levelOptions}
              dayOptions={dayOptions}
              onChange={updateFilter}
              onClear={() => setFilters({ subject: "", grade: "", level: "", dayOfWeek: "" })}
            />
            <AllClassesList classes={filteredClasses} enrolledIds={enrolledIds}
              requesting={requesting} requested={requested} error={requestError} onRequest={handleRequest} />
          </>
        )}

        {cancelTarget && (
          <CancelSessionDialog
            classId={cancelTarget.class.classId}
            className={cancelTarget.class.name}
            date={cancelTarget.date}
            onClose={() => setCancelTarget(null)}
            onCancelled={() => { handleCancelled(); setCancelTarget(null); }}
            alternatives={alternatives}
          />
        )}
        <div className="pb-8" />
      </div>
    </div>
  );
}

