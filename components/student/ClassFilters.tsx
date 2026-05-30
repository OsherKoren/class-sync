"use client";

import { useTranslations } from "next-intl";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export type ClassFilterState = {
  subject: string;
  grade: string;
  level: string;
  dayOfWeek: string;
};

export type FilterOption = { value: string; label: string };

export function ClassFilters({
  filters,
  subjectOptions,
  gradeOptions,
  levelOptions,
  dayOptions,
  onChange,
  onClear,
}: {
  filters: ClassFilterState;
  subjectOptions: FilterOption[];
  gradeOptions: FilterOption[];
  levelOptions: FilterOption[];
  dayOptions: FilterOption[];
  onChange: (key: keyof ClassFilterState, value: string) => void;
  onClear: () => void;
}) {
  const t = useTranslations("student.classes.filters");
  const hasActive = Object.values(filters).some((v) => v !== "");

  function displayLabel(options: FilterOption[], value: string, fallback: string) {
    if (!value) return fallback;
    return options.find((o) => o.value === value)?.label ?? fallback;
  }

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {subjectOptions.length >= 1 && (
        <Select value={filters.subject || "all"} onValueChange={(v) => onChange("subject", v === "all" ? "" : (v ?? ""))}>
          <SelectTrigger className="w-40 h-8 text-sm">
            <SelectValue>{displayLabel(subjectOptions, filters.subject, t("allSubjects"))}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allSubjects")}</SelectItem>
            {subjectOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {gradeOptions.length >= 1 && (
        <Select value={filters.grade || "all"} onValueChange={(v) => onChange("grade", v === "all" ? "" : (v ?? ""))}>
          <SelectTrigger className="w-32 h-8 text-sm">
            <SelectValue>{displayLabel(gradeOptions, filters.grade, t("allGrades"))}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allGrades")}</SelectItem>
            {gradeOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {levelOptions.length >= 1 && (
        <Select value={filters.level || "all"} onValueChange={(v) => onChange("level", v === "all" ? "" : (v ?? ""))}>
          <SelectTrigger className="w-36 h-8 text-sm">
            <SelectValue>{displayLabel(levelOptions, filters.level, t("allLevels"))}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allLevels")}</SelectItem>
            {levelOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {dayOptions.length >= 1 && (
        <Select value={filters.dayOfWeek || "all"} onValueChange={(v) => onChange("dayOfWeek", v === "all" ? "" : (v ?? ""))}>
          <SelectTrigger className="w-36 h-8 text-sm">
            <SelectValue>{displayLabel(dayOptions, filters.dayOfWeek, t("allDays"))}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allDays")}</SelectItem>
            {dayOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {hasActive && (
        <Button variant="ghost" size="sm" className="h-8 text-sm" onClick={onClear}>
          {t("clear")}
        </Button>
      )}
    </div>
  );
}
