import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    const role = session.user.role;
    switch (role) {
      case "TEACHER":
        redirect("/teacher/dashboard");
      case "STUDENT":
        redirect("/student/dashboard");
      case "GUARDIAN":
        redirect("/guardian/dashboard");
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-screen bg-background px-4">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground text-3xl font-bold">
          C
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            ClassSync
          </h1>
          <p className="text-muted-foreground text-lg">
            Scheduling made simple for teachers and students
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <Link
            href="/login"
            className="flex h-11 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="flex h-11 items-center justify-center rounded-lg border border-input bg-background px-8 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
