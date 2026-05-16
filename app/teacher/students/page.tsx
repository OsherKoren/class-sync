import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTeacherStudents } from "@/lib/actions/guardian";

export default async function StudentsPage() {
  const result = await getTeacherStudents();

  if ("error" in result) {
    return (
      <div className="p-8">
        <p className="text-destructive">{result.error}</p>
      </div>
    );
  }

  const guardians = result.data;

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Students</h1>
            <p className="text-muted-foreground">
              Manage students and their guardians
            </p>
          </div>
          <Link href="/teacher/students/new">
            <Button>Add guardian &amp; student</Button>
          </Link>
        </div>

        {guardians.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No guardians yet.{" "}
                <Link
                  href="/teacher/students/new"
                  className="underline underline-offset-4"
                >
                  Add your first guardian
                </Link>
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {guardians.map((guardian) => (
              <Link
                key={guardian.guardianId}
                href={`/teacher/students/${guardian.guardianId}`}
              >
                <Card className="hover:bg-accent transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{guardian.guardianName}</CardTitle>
                        <CardDescription>{guardian.guardianEmail}</CardDescription>
                      </div>
                      <div className="text-right text-sm font-medium">
                        {guardian.students.length}{" "}
                        {guardian.students.length === 1 ? "student" : "students"}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
