import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

export default async function ClassesPage() {
  const result = await getTeacherClasses();

  if ("error" in result) {
    return (
      <div className="p-8">
        <p className="text-destructive">{result.error}</p>
      </div>
    );
  }

  const classes = result.data;

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Classes</h1>
            <p className="text-muted-foreground">
              Manage your classes and enrollments
            </p>
          </div>
          <Button asChild>
            <Link href="/teacher/classes/new">Create class</Link>
          </Button>
        </div>

        {classes.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No classes yet.{" "}
                <Link
                  href="/teacher/classes/new"
                  className="underline underline-offset-4"
                >
                  Create your first class
                </Link>
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {classes.map((cls) => (
              <Link key={cls.id} href={`/teacher/classes/${cls.id}`}>
                <Card className="hover:bg-accent transition-colors cursor-pointer">
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
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {cls.enrollmentCount}{" "}
                      {cls.enrollmentCount === 1 ? "student" : "students"}
                      enrolled • {cls.duration} minutes per session
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
