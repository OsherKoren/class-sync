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
import { enrollStudent, getFamilyById } from "@/lib/actions/family";
import { getTeacherClasses } from "@/lib/actions/class";

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function EnrollStudentPage({
  params,
}: {
  params: Promise<{ id: string; studentId: string }>;
}) {
  const { id: familyId, studentId } = use(params);
  const [family, setFamily] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [enrollError, setEnrollError] = useState("");
  const [enrolled, setEnrolled] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadData() {
      const familyResult = await getFamilyById(familyId);
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
  }, [familyId]);

  const student = family?.students.find((s: any) => s.id === studentId);

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
        <p>Loading...</p>
      </div>
    );
  }

  if (error || !family || !student) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-destructive">{error || "Student not found"}</p>
          <Link href={`/teacher/students/${familyId}`} className="mt-4 inline-block">
            <Button>Back to family</Button>
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
            href={`/teacher/students/${familyId}`}
            className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
          >
            ← Back to family
          </Link>
          <h1 className="text-3xl font-bold mb-2">Enroll {student.name}</h1>
          <p className="text-muted-foreground">
            Select a class to enroll this student
          </p>
        </div>

        {classes.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No classes available. Create a class first.
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
                        {dayNames[cls.dayOfWeek]} at {cls.startTime}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {cls.enrollmentCount}{" "}
                    {cls.enrollmentCount === 1 ? "student" : "students"} enrolled •{" "}
                    {cls.duration} minutes per session
                  </p>

                  {enrollError && cls.id === enrolling && (
                    <p className="text-sm text-destructive">{enrollError}</p>
                  )}

                  <Button
                    onClick={() => handleEnroll(cls.id)}
                    disabled={enrolling === cls.id || enrolled.has(cls.id)}
                  >
                    {enrolled.has(cls.id)
                      ? "Enrolled"
                      : enrolling === cls.id
                        ? "Enrolling…"
                        : "Enroll in this class"}
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
