"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { redeemLinkCode } from "@/lib/actions/link-code";

export default function GuardianLinkPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setError("");
    const result = await redeemLinkCode(trimmed);
    if ("error" in result) {
      setError(result.error);
      setSubmitting(false);
    } else {
      router.push("/guardian/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-md mx-auto">
        <Link
          href="/guardian/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
        >
          ← Back to dashboard
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>Link to a student</CardTitle>
            <CardDescription>
              Enter the guardian invite code shared with you to link your account to a student.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Invite code</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ""))}
                  placeholder="AB3X7Q"
                  maxLength={6}
                  className="font-mono tracking-widest text-center text-xl uppercase"
                  autoFocus
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={submitting || !code.trim()} className="w-full">
                {submitting ? "Linking…" : "Link account"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
