import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode } from "@/components/link-code/QrCode";
import { getStudentForGuardian } from "@/lib/actions/guardian-dashboard";
import { getActiveLinkCodes, createLinkCode, revokeLinkCode } from "@/lib/actions/link-code";

export default async function StudentLinkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: studentId } = await params;

  const [studentResult, codesResult] = await Promise.all([
    getStudentForGuardian(studentId),
    getActiveLinkCodes(studentId),
  ]);

  if ("error" in studentResult) redirect("/guardian/dashboard");

  const student = studentResult.data;
  const codes = "error" in codesResult ? [] : codesResult.data;
  const studentCodes = codes.filter((c) => c.kind === "CLAIM_STUDENT");
  const guardianCodes = codes.filter((c) => c.kind === "CLAIM_GUARDIAN");

  async function handleCreateStudentCode() {
    "use server";
    await createLinkCode(studentId, "CLAIM_STUDENT");
    redirect(`/guardian/students/${studentId}/link`);
  }

  async function handleCreateGuardianCode() {
    "use server";
    await createLinkCode(studentId, "CLAIM_GUARDIAN");
    redirect(`/guardian/students/${studentId}/link`);
  }

  async function handleRevoke(formData: FormData) {
    "use server";
    const code = formData.get("code") as string;
    await revokeLinkCode(code);
    redirect(`/guardian/students/${studentId}/link`);
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-lg mx-auto">
        <Link
          href="/guardian/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
        >
          ← Back to dashboard
        </Link>
        <h1 className="text-2xl font-bold mb-1">{student.name}</h1>
        <p className="text-muted-foreground text-sm mb-8">Manage link codes</p>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Student claim codes</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Share with {student.name} so they can log in and claim this profile.
          </p>
          {student.hasAccount && (
            <p className="text-sm text-green-600 dark:text-green-400 mb-4">
              Student has already claimed their account.
            </p>
          )}
          <CodeList codes={studentCodes} onRevoke={handleRevoke} />
          {!student.hasAccount && (
            <form action={handleCreateStudentCode} className="mt-3">
              <Button type="submit" variant="outline" className="w-full">
                Generate student code
              </Button>
            </form>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Guardian invite codes</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Share with another parent or guardian so they can link to {student.name}.
          </p>
          <CodeList codes={guardianCodes} onRevoke={handleRevoke} />
          <form action={handleCreateGuardianCode} className="mt-3">
            <Button type="submit" variant="outline" className="w-full">
              Generate guardian code
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}

async function CodeList({
  codes,
  onRevoke,
}: {
  codes: Array<{ code: string; expiresAt: Date }>;
  onRevoke: (formData: FormData) => Promise<void>;
}) {
  if (codes.length === 0) {
    return <p className="text-sm text-muted-foreground">No active codes.</p>;
  }

  return (
    <div className="space-y-4">
      {codes.map((entry) => (
        <Card key={entry.code}>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-mono tracking-widest text-center">
              {entry.code}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <QrCode value={entry.code} size={160} />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Expires {new Date(entry.expiresAt).toLocaleString()}
            </p>
            <form action={onRevoke}>
              <input type="hidden" name="code" value={entry.code} />
              <Button type="submit" variant="outline" size="sm" className="w-full">
                Revoke
              </Button>
            </form>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
