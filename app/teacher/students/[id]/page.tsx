"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getGuardianStudents, addStudent } from "@/lib/actions/guardian";

type GuardianData = {
  guardianId: string;
  guardianName: string;
  guardianEmail: string;
  students: Array<{ id: string; name: string }>;
};

export default function GuardianDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: guardianId } = use(params);
  const [guardian, setGuardian] = useState<GuardianData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingStudent, setAddingStudent] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [addError, setAddError] = useState("");

  useEffect(() => {
    async function loadGuardian() {
      const result = await getGuardianStudents(guardianId);
      if ("error" in result) {
        setError(result.error);
      } else {
        setGuardian(result.data);
      }
      setLoading(false);
    }
    loadGuardian();
  }, [guardianId]);

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    setAddingStudent(true);
    setAddError("");

    const result = await addStudent(guardianId, { name: studentName });
    if ("error" in result) {
      setAddError(result.error);
      setAddingStudent(false);
      return;
    }

    setStudentName("");
    if (guardian) {
      setGuardian({
        ...guardian,
        students: [...guardian.students, { id: result.data.id, name: studentName }],
      });
    }
    setAddingStudent(false);
  }

  if (loading) {
    return (
      <div className="p-8">
        <p>Loading...</p>
      </div>
    );
  }

  if (error || !guardian) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-destructive">{error || "Guardian not found"}</p>
          <Link href="/teacher/students" className="mt-4 inline-block">
            <Button>Back to students</Button>
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
            href="/teacher/students"
            className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
          >
            ← Back to students
          </Link>
          <h1 className="text-3xl font-bold mb-2">{guardian.guardianName}</h1>
          <p className="text-muted-foreground">{guardian.guardianEmail}</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Students</CardTitle>
              <CardDescription>
                Students linked to this guardian
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {guardian.students.length === 0 ? (
                <p className="text-muted-foreground mb-4">
                  No students linked yet.
                </p>
              ) : (
                <div className="space-y-2 mb-4">
                  {guardian.students.map((student) => (
                    <div
                      key={student.id}
                      className="p-3 border rounded-lg flex items-center justify-between"
                    >
                      <p className="font-medium">{student.name}</p>
                      <Link
                        href={`/teacher/students/${guardianId}/${student.id}/enroll`}
                        className="text-sm text-primary hover:underline"
                      >
                        Enroll in class
                      </Link>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleAddStudent} className="space-y-3 pt-4 border-t">
                <div>
                  <Label htmlFor="studentName">Add new student</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="studentName"
                      placeholder="Student name"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      required
                    />
                    <Button type="submit" disabled={addingStudent}>
                      Add
                    </Button>
                  </div>
                  {addError && (
                    <p className="text-sm text-destructive mt-1">{addError}</p>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
