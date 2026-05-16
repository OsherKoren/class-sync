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
import { getFamilyById, addStudent } from "@/lib/actions/family";

export default function FamilyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: familyId } = use(params);
  const [family, setFamily] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingStudent, setAddingStudent] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [addError, setAddError] = useState("");

  useEffect(() => {
    async function loadFamily() {
      const result = await getFamilyById(familyId);
      if ("error" in result) {
        setError(result.error);
      } else {
        setFamily(result.data);
      }
      setLoading(false);
    }
    loadFamily();
  }, [familyId]);

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    setAddingStudent(true);
    setAddError("");

    const result = await addStudent(params.id, { name: studentName });
    if ("error" in result) {
      setAddError(result.error);
      setAddingStudent(false);
      return;
    }

    setStudentName("");
    setFamily({
      ...family,
      students: [...family.students, result.data],
    });
    setAddingStudent(false);
  }

  if (loading) {
    return (
      <div className="p-8">
        <p>Loading...</p>
      </div>
    );
  }

  if (error || !family) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-destructive">{error || "Family not found"}</p>
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
          <h1 className="text-3xl font-bold mb-2">{family.userName}</h1>
          <p className="text-muted-foreground">{family.userEmail}</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Students</CardTitle>
              <CardDescription>
                Manage students for this family
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {family.students.length === 0 ? (
                <p className="text-muted-foreground mb-4">
                  No students yet for this family.
                </p>
              ) : (
                <div className="space-y-2 mb-4">
                  {family.students.map((student: any) => (
                    <div
                      key={student.id}
                      className="p-3 border rounded-lg flex items-center justify-between"
                    >
                      <p className="font-medium">{student.name}</p>
                      <Link
                        href={`/teacher/students/${params.id}/${student.id}/enroll`}
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
                    <Button
                      type="submit"
                      disabled={addingStudent}
                    >
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
