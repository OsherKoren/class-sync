"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { deleteClass } from "@/lib/actions/class";

export function DeleteClassSection({ classId }: { classId: string }) {
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleDelete() {
    if (confirmText !== "delete") {
      setError("Please type 'delete' to confirm");
      return;
    }

    setDeleting(true);
    setError("");

    const result = await deleteClass(classId, confirmText);

    if ("error" in result) {
      setError(result.error);
      setDeleting(false);
      return;
    }

    router.push("/teacher/classes");
    router.refresh();
  }

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="text-destructive">Delete class</CardTitle>
        <CardDescription>This action cannot be undone</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Type <span className="font-mono font-bold">delete</span> below to confirm deletion of this class.
        </p>

        <div>
          <Label htmlFor="confirmDelete">Confirmation</Label>
          <Input
            id="confirmDelete"
            type="text"
            placeholder="Type 'delete' here"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            disabled={deleting}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={deleting || confirmText !== "delete"}
        >
          {deleting ? "Deleting…" : "Delete class"}
        </Button>
      </CardContent>
    </Card>
  );
}
