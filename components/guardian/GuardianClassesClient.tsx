"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { type StudentClass } from "@/lib/types";
import { MyClassesList } from "@/components/student/MyClassesList";
import { StudentWeekView } from "@/components/student/StudentWeekView";
import { StudentDayView } from "@/components/student/StudentDayView";

type ViewMode = "list" | "week" | "day";
type Student = { id: string; name: string; classes: StudentClass[] };

const EMPTY_MAP: Map<string, Set<string>> = new Map();
const NOOP: (cls: StudentClass, date: string) => void = () => {};

export function GuardianClassesClient({ students }: { students: Student[] }) {
  const t = useTranslations();
  const [selectedId, setSelectedId] = useState(students[0]?.id ?? "");
  const [view, setView] = useState<ViewMode>("week");

  const selected = students.find((s) => s.id === selectedId);

  const viewLabels: Record<ViewMode, string> = {
    list: t("schedule.listView"),
    week: t("schedule.weekView"),
    day: t("schedule.dayView"),
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-8">
        <div className="pt-8 mb-6">
          <Link
            href="/guardian/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
          >
            {t("guardian.classes.backToDashboard")}
          </Link>
          <h1 className="text-3xl font-bold">{t("guardian.classes.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("guardian.classes.subtitle")}</p>
        </div>

        {students.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">{t("guardian.classes.noChildren")}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              {students.length > 1 && (
                <div className="flex border rounded-md overflow-hidden divide-x">
                  {students.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedId(s.id)}
                      className={cn(
                        "px-4 py-1.5 text-sm transition-colors",
                        selectedId === s.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent active:bg-accent/80"
                      )}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex border rounded-md overflow-hidden divide-x">
                {(["list", "week", "day"] as ViewMode[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={cn(
                      "px-4 py-1.5 text-sm transition-colors",
                      view === v ? "bg-primary text-primary-foreground" : "hover:bg-accent active:bg-accent/80"
                    )}
                  >
                    {viewLabels[v]}
                  </button>
                ))}
              </div>
            </div>

            {selected && selected.classes.length === 0 && (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">{t("guardian.classes.noEnrollments")}</p>
                </CardContent>
              </Card>
            )}

            {selected && selected.classes.length > 0 && view === "list" && (
              <MyClassesList
                classes={selected.classes}
                cancelledSessions={EMPTY_MAP}
                onCancelClick={NOOP}
                readOnly
              />
            )}
            {selected && selected.classes.length > 0 && view === "week" && (
              <StudentWeekView
                classes={selected.classes}
                cancelledSessions={EMPTY_MAP}
                onCancelClick={NOOP}
                readOnly
              />
            )}
            {selected && selected.classes.length > 0 && view === "day" && (
              <StudentDayView
                classes={selected.classes}
                cancelledSessions={EMPTY_MAP}
                onCancelClick={NOOP}
                readOnly
              />
            )}
          </>
        )}
        <div className="pb-8" />
      </div>
    </div>
  );
}
