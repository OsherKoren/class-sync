import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function TeacherDashboard() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Teacher Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome, {session?.user?.name || "Teacher"}
            </p>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <Button type="submit" variant="outline">
              Sign out
            </Button>
          </form>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Link href="/teacher/classes">
            <div className="rounded-lg border border-border bg-card p-6 hover:bg-accent transition-colors cursor-pointer h-full">
              <h2 className="text-lg font-semibold mb-2">Classes</h2>
              <p className="text-sm text-muted-foreground">
                Manage your classes and students
              </p>
            </div>
          </Link>

          <Link href="/teacher/students">
            <div className="rounded-lg border border-border bg-card p-6 hover:bg-accent transition-colors cursor-pointer h-full">
              <h2 className="text-lg font-semibold mb-2">Students</h2>
              <p className="text-sm text-muted-foreground">
                View and manage enrolled families
              </p>
            </div>
          </Link>

          <div className="rounded-lg border border-border bg-card p-6 opacity-50">
            <h2 className="text-lg font-semibold mb-2">Reschedules</h2>
            <p className="text-sm text-muted-foreground">
              Offer new time slots and view voting results
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 opacity-50">
            <h2 className="text-lg font-semibold mb-2">Settings</h2>
            <p className="text-sm text-muted-foreground">
              Manage your account and calendar
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
