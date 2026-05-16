import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getClassById } from "@/lib/actions/class";

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default async function ClassDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const result = await getClassById(params.id);

  if ("error" in result) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-destructive">{result.error}</p>
          <Button asChild className="mt-4">
            <Link href="/teacher/classes">Back to classes</Link>
          </Button>
        </div>
      </div>
    );
  }

  const classData = result.data;

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            href="/teacher/classes"
            className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
          >
            ← Back to classes
          </Link>
          <h1 className="text-3xl font-bold mb-2">{classData.name}</h1>
          <p className="text-muted-foreground">{classData.subject}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Type</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{classData.type}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{classData.startTime}</p>
              <p className="text-xs text-muted-foreground">
                {dayNames[classData.dayOfWeek]} • {classData.duration} min
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Enrolled</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{classData.enrollments.length}</p>
              <p className="text-xs text-muted-foreground">
                {classData.enrollments.length === 1 ? "student" : "students"}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Enrolled students</CardTitle>
            <CardDescription>
              Students enrolled in this class
            </CardDescription>
          </CardHeader>
          <CardContent>
            {classData.enrollments.length === 0 ? (
              <p className="text-muted-foreground">
                No students enrolled yet.{" "}
                <Link
                  href="/teacher/students"
                  className="underline underline-offset-4"
                >
                  Go to students page to enroll
                </Link>
              </p>
            ) : (
              <div className="space-y-2">
                {classData.enrollments.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{enrollment.studentName}</p>
                      <p className="text-sm text-muted-foreground">
                        ID: {enrollment.studentId.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
