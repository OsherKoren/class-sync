import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMyStudents } from "@/lib/actions/guardian-dashboard";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function GuardianDashboard() {
  const session = await auth();
  const result = await getMyStudents();
  const students = "error" in result ? [] : result.data;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Children</h1>
            <p className="text-muted-foreground">
              Welcome, {session?.user?.name || "Guardian"}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/guardian/students/new">
              <Button variant="outline">Add child</Button>
            </Link>
            <Link href="/guardian/link">
              <Button variant="outline">Link via code</Button>
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <Button type="submit" variant="outline">Sign out</Button>
            </form>
          </div>
        </div>

        {students.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-4">No children linked to your account yet.</p>
              <div className="flex gap-2 justify-center">
                <Link href="/guardian/students/new">
                  <Button>Add a child</Button>
                </Link>
                <Link href="/guardian/link">
                  <Button variant="outline">Enter invite code</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {students.map((student) => {
              const active = student.enrollments.filter((e) => e.status === "ACTIVE");
              const pending = student.enrollments.filter((e) => e.status === "PENDING");
              return (
                <Card key={student.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{student.name}</CardTitle>
                      <Link href={`/guardian/students/${student.id}/link`}>
                        <Button variant="outline" size="sm">Manage links</Button>
                      </Link>
                    </div>
                    {!student.hasAccount && (
                      <p className="text-xs text-yellow-600 dark:text-yellow-400">
                        Student hasn&apos;t claimed their account yet
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    {active.length === 0 && pending.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Not enrolled in any classes.</p>
                    ) : (
                      <div className="space-y-2">
                        {active.map((e) => (
                          <div key={e.class.id} className="flex items-center justify-between text-sm">
                            <span>{e.class.name} — {e.class.subject}</span>
                            <span className="text-muted-foreground">
                              {dayNames[e.class.dayOfWeek]} at {e.class.startTime}
                            </span>
                          </div>
                        ))}
                        {pending.map((e) => (
                          <div key={e.class.id} className="flex items-center justify-between text-sm">
                            <span>{e.class.name} — {e.class.subject}</span>
                            <span className="text-yellow-600 dark:text-yellow-400 text-xs">Pending</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
