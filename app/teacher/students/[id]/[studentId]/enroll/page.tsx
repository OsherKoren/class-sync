"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { enrollStudent, getGuardianStudents } from "@/lib/actions/guardian";
import { getTeacherClasses } from "@/lib/actions/class";
import { useTranslations } from "next-intl";

type GuardianData = {
  guardianId: string;
  guardianName: string;
  guardianEmail: string;
  students: Array<{ id: string; name: string }>;
};

type ClassInfo = {
  id: string;
  name: string;
  subject: string;
  type: string;
  dayOfWeek: number;
  startTime: string;
  duration: number;
  enrollmentCount: number;
};

export default function EnrollStudentPage({
  params,
}: {
  params: Promise<{ id: string; studentId: string }>;
}) {
  const { id: guardianId, studentId } = use(params);
  const [family, setFamily] = useState<GuardianData | null>(null);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [enrollError, setEnrollError] = useState("");
  const [enrolled, setEnrolled] = useState<Set<string>>(new Set());
  const t = useTranslations();

  useEffect(() => {
    async function loadData() {
      const familyResult = await getGuardianStudents(guardianId);
      const classesResult = await getTeacherClasses();

      if ("error" in familyResult) {
        setError(familyResult.error);
      } else {
        setFamily(familyResult.data);
      }

      if ("error" in classesResult) {
        setError(classesResult.error);
      } else {
        setClasses(classesResult.data);
      }

      setLoading(false);
    }
    loadData();
  }, [guardianId]);

  const student = family?.students?.find((s) => s.id === studentId);

  async function handleEnroll(classId: string) {
    setEnrolling(classId);
    setEnrollError("");

    const result = await enrollStudent(studentId, classId);
    if ("error" in result) {
      setEnrollError(result.error);
    } else {
      setEnrolled((prev) => new Set([...prev, classId]));
    }
    setEnrolling(null);
  }

  if (loading) {
    return (
      <div className="p-8">
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  if (error || !family || !student) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-destructive">{error || t('teacher.enrollStudent.notFound')}</p>
          <Link href={`/teacher/students/${guardianId}`} className="mt-4 inline-block">
            <Button>{t('teacher.enrollStudent.backBtn')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            href={`/teacher/students/${guardianId}`}
            className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
          >
            {t('teacher.enrollStudent.backToStudents')}
          </Link>
          <h1 className="text-3xl font-bold mb-2">{student.name}</h1>
          <p className="text-muted-foreground">
            {t('teacher.enrollStudent.subtitle')}
          </p>
        </div>

        {classes.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                {t('teacher.enrollStudent.noClasses')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {classes.map((cls) => (
              <Card key={cls.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{cls.name}</CardTitle>
                      <CardDescription>{cls.subject}</CardDescription>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-medium">{cls.type}</p>
                      <p className="text-muted-foreground">
                        {t(`days.${cls.dayOfWeek}` as `days.${number}`)} at {cls.startTime}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {cls.enrollmentCount}{" "}
                    {cls.enrollmentCount === 1 ? t('common.student') : t('common.students')} enrolled •{" "}
                    {cls.duration} {t('common.minutesPerSession')}
                  </p>

                  {enrollError && cls.id === enrolling && (
                    <p className="text-sm text-destructive">{enrollError}</p>
                  )}

                  <Button
                    onClick={() => handleEnroll(cls.id)}
                    disabled={enrolling === cls.id || enrolled.has(cls.id)}
                  >
                    {enrolled.has(cls.id)
                      ? t('teacher.enrollStudent.alreadyEnrolled')
                      : enrolling === cls.id
                        ? t('teacher.enrollStudent.enrolling')
                        : t('teacher.enrollStudent.enroll')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
