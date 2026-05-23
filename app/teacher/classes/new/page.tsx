"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClass } from "@/lib/actions/class";
import { GRADE_KEYS } from "@/lib/classKeys";
import { useTranslations } from "next-intl";

const gradeNums = [4, 5, 6, 7, 8, 9, 10];

export default function CreateClassPage() {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [type, setType] = useState<"GROUP" | "PRIVATE">("GROUP");
  const [level, setLevel] = useState("");
  const [grade, setGrade] = useState("");
  const [gradeCustom, setGradeCustom] = useState(false);
  const [subjectCustom, setSubjectCustom] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState("0");
  const [startTime, setStartTime] = useState("16:00");
  const [duration, setDuration] = useState("45");
  const [maxCapacity, setMaxCapacity] = useState("4");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations();

  // Generate 15-minute intervals for the dropdown
  const timeOptions = Array.from({ length: 96 }, (_, i) => {
    const hours = Math.floor(i / 4);
    const minutes = (i % 4) * 15;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await createClass({
        name,
        subject,
        type,
        level: level || undefined,
        grade,
        dayOfWeek: parseInt(dayOfWeek),
        startTime,
        duration: parseInt(duration),
        maxCapacity: type === "GROUP" && maxCapacity ? parseInt(maxCapacity) : undefined,
      });

      if ("error" in result) {
        setError(result.error);
        setLoading(false);
        return;
      }

      router.push("/teacher/classes");
    } catch {
      setError(t('common.somethingWentWrong'));
      setLoading(false);
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('teacher.createClass.title')}</h1>
          <p className="text-muted-foreground">
            {t('teacher.createClass.subtitle')}
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">{t('teacher.createClass.className')}</Label>
                  <Input
                    id="name"
                    placeholder={t('teacher.createClass.classNamePlaceholder')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="subject">{t('teacher.createClass.subject')}</Label>
                  {subjectCustom ? (
                    <div className="flex gap-2">
                      <Input
                        id="subject"
                        placeholder={t('teacher.createClass.subjectPlaceholder')}
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="flex-1"
                        required
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => { setSubjectCustom(false); setSubject(""); }}
                        className="shrink-0"
                      >
                        {t('common.cancel')}
                      </Button>
                    </div>
                  ) : (
                    <Select
                      value={subject}
                      onValueChange={(v) => {
                        if (v === null) return;
                        if (v === "CUSTOM") { setSubjectCustom(true); setSubject(""); }
                        else setSubject(v);
                      }}
                    >
                      <SelectTrigger id="subject">
                        <span>{subject ? t(`teacher.createClass.subjects.${subject}` as `teacher.createClass.subjects.${string}`) : t('teacher.createClass.selectSubject')}</span>
                      </SelectTrigger>
                      <SelectContent>
                        {(["mathematics","english"] as const).map((key) => (
                          <SelectItem key={key} value={key}>
                            {t(`teacher.createClass.subjects.${key}` as `teacher.createClass.subjects.${string}`)}
                          </SelectItem>
                        ))}
                        <SelectItem value="CUSTOM">{t('teacher.createClass.customGrade')}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div>
                  <Label htmlFor="type">{t('teacher.createClass.classType')}</Label>
                  <Select value={type} onValueChange={(v) => {
                    if (v !== null) {
                      setType(v as "GROUP" | "PRIVATE");
                      if (v === "GROUP") setMaxCapacity("4");
                      else setMaxCapacity("");
                    }
                  }}>
                    <SelectTrigger id="type">
                      <span>{t(`classTypes.${type}` as `classTypes.${string}`)}</span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GROUP">{t('teacher.createClass.group')}</SelectItem>
                      <SelectItem value="PRIVATE">{t('teacher.createClass.private')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="level">{t('teacher.createClass.level')}</Label>
                  <Select value={level} onValueChange={(v) => { if (v !== null) setLevel(v === "NONE" ? "" : v); }}>
                    <SelectTrigger id="level">
                      <span>{level ? t(`classLevels.${level}` as `classLevels.${string}`) : t('teacher.createClass.selectLevel')}</span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">{t('teacher.createClass.noLevel')}</SelectItem>
                      <SelectItem value="BEGINNER">{t('teacher.createClass.beginner')}</SelectItem>
                      <SelectItem value="INTERMEDIATE">{t('teacher.createClass.intermediate')}</SelectItem>
                      <SelectItem value="ADVANCED">{t('teacher.createClass.advanced')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {type === "GROUP" && (
                  <div>
                    <Label htmlFor="maxCapacity">{t('teacher.createClass.maxCapacity')}</Label>
                    <Input
                      id="maxCapacity"
                      type="number"
                      min="1"
                      step="1"
                      value={maxCapacity}
                      onChange={(e) => setMaxCapacity(e.target.value)}
                      placeholder="4"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('teacher.createClass.maxCapacityHint')}
                    </p>
                  </div>
                )}

                <div>
                  <Label htmlFor="grade">{t('teacher.createClass.grade')}</Label>
                  {gradeCustom ? (
                    <div className="flex gap-2">
                      <Input
                        id="grade"
                        placeholder={t('teacher.createClass.gradePlaceholder')}
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => { setGradeCustom(false); setGrade(""); }}
                        className="shrink-0"
                      >
                        {t('common.cancel')}
                      </Button>
                    </div>
                  ) : (
                    <Select
                      value={grade}
                      onValueChange={(v) => {
                        if (v === null) return;
                        if (v === "CUSTOM") { setGradeCustom(true); setGrade(""); }
                        else setGrade(v);
                      }}
                    >
                      <SelectTrigger id="grade">
                        <span>{grade ? (GRADE_KEYS.has(grade) ? t(`teacher.createClass.grades.${grade}` as `teacher.createClass.grades.${number}`) : grade) : t('teacher.createClass.selectGrade')}</span>
                      </SelectTrigger>
                      <SelectContent>
                        {gradeNums.map((g) => (
                          <SelectItem key={g} value={g.toString()}>
                            {t(`teacher.createClass.grades.${g}` as `teacher.createClass.grades.${number}`)}
                          </SelectItem>
                        ))}
                        <SelectItem value="CUSTOM">{t('teacher.createClass.customGrade')}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div>
                  <Label htmlFor="dayOfWeek">{t('teacher.createClass.day')}</Label>
                  <Select value={dayOfWeek} onValueChange={(v) => { if (v !== null) setDayOfWeek(v); }}>
                    <SelectTrigger id="dayOfWeek">
                      <span>{t(`days.${dayOfWeek}` as `days.${number}`)}</span>
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2, 3, 4, 5, 6].map((index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {t(`days.${index}` as `days.${number}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="startTime">{t('teacher.createClass.startTime')}</Label>
                  <div className="flex gap-2">
                    <Select value={startTime} onValueChange={(v) => { if (v !== null) setStartTime(v); }}>
                      <SelectTrigger className="flex-1" id="startTime">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-32"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('teacher.createClass.startTimeHint')}
                  </p>
                </div>

                <div>
                  <Label htmlFor="duration">{t('teacher.createClass.duration')}</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="15"
                    step="15"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex gap-4">
                <Button type="submit" disabled={loading || !name || !subject || !grade}>
                  {loading ? t('teacher.createClass.creating') : t('teacher.createClass.create')}
                </Button>
                <Link href="/teacher/classes">
                  <Button type="button" variant="outline" disabled={loading}>
                    {t('common.cancel')}
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
