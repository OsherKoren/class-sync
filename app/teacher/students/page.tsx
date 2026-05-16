import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTeacherFamilies } from "@/lib/actions/family";

export default async function StudentsPage() {
  const result = await getTeacherFamilies();

  if ("error" in result) {
    return (
      <div className="p-8">
        <p className="text-destructive">{result.error}</p>
      </div>
    );
  }

  const families = result.data;

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Families & Students</h1>
            <p className="text-muted-foreground">
              Manage families and their students
            </p>
          </div>
          <Button asChild>
            <Link href="/teacher/students/new">Add family</Link>
          </Button>
        </div>

        {families.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No families yet.{" "}
                <Link
                  href="/teacher/students/new"
                  className="underline underline-offset-4"
                >
                  Add your first family
                </Link>
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {families.map((family) => (
              <Link
                key={family.id}
                href={`/teacher/students/${family.id}`}
              >
                <Card className="hover:bg-accent transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{family.userName}</CardTitle>
                        <CardDescription>{family.userEmail}</CardDescription>
                      </div>
                      <div className="text-right text-sm font-medium">
                        {family.studentCount}{" "}
                        {family.studentCount === 1 ? "student" : "students"}
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
