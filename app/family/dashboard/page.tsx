import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function FamilyDashboard() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Family Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome, {session?.user?.name || "Family"}
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

        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Upcoming Sessions</h2>
            <div className="rounded-lg border border-border bg-card p-6">
              <p className="text-sm text-muted-foreground">
                No upcoming sessions yet
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Active Votes</h2>
            <div className="rounded-lg border border-border bg-card p-6">
              <p className="text-sm text-muted-foreground">
                No active votes at the moment
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
