"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createFamily } from "@/lib/actions/family";

export default function AddFamilyPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await createFamily({
      name,
      email,
    });

    if ("error" in result) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push(`/teacher/students/${result.data.familyId}`);
    router.refresh();
  }

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Add family</h1>
          <p className="text-muted-foreground">
            Create a new family account and add their students
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name">Family name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Smith Family"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="family@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  A temporary password will be sent to this email address.
                  The family can change it after first login.
                </p>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating…" : "Create family"}
                </Button>
                <Link href="/teacher/students">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
