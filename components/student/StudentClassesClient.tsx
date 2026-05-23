"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { requestEnrollment } from "@/lib/actions/student";
import { type StudentClass } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CancelSessionDialog } from "./CancelSessionDialog";
import { MyClassesList } from "./MyClassesList";
import { AllClassesList } from "./AllClassesList";
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

  const enrolledIds = new Set(enrolledClasses.map((c) => c.classId));

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

        <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm py-3 -mx-8 px-8 border-b mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex border rounded-md overflow-hidden divide-x">
            {(["mine", "all"] as Tab[]).map((tt) => (
              <button key={tt} onClick={() => setTab(tt)}
                className={cn("px-4 py-1.5 text-sm transition-colors",
                  tab === tt ? "bg-primary text-primary-foreground" : "hover:bg-accent")}>
                {tt === "mine" ? t("student.classes.tabMine") : t("student.classes.tabAll")}
              </button>
            ))}
          </div>
          {tab === "mine" && (
            <div className="flex border rounded-md overflow-hidden divide-x">
              {(["list", "week", "day"] as ViewMode[]).map((v) => (
                <button key={v} onClick={() => setView(v)}
                  className={cn("px-4 py-1.5 text-sm transition-colors",
                    view === v ? "bg-primary text-primary-foreground" : "hover:bg-accent")}>
                  {viewLabels[v]}
                </button>
              ))}
            </div>
          )}
        </div>
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
          <AllClassesList classes={openClasses} enrolledIds={enrolledIds}
            requesting={requesting} requested={requested} error={requestError} onRequest={handleRequest} />
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

