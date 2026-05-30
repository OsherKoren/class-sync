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
import { useTranslations } from "next-intl";

export function DeleteClassSection({ classId }: { classId: string }) {
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const t = useTranslations();

  async function handleDelete() {
    if (confirmText !== "delete") {
      setError(t('components.deleteClass.confirmError'));
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
        <CardTitle className="text-destructive">{t('components.deleteClass.title')}</CardTitle>
        <CardDescription>{t('components.deleteClass.warning')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t('components.deleteClass.instructions')}
        </p>

        <div>
          <Label htmlFor="confirmDelete">{t('components.deleteClass.confirmLabel')}</Label>
          <Input
            id="confirmDelete"
            type="text"
            placeholder={t('components.deleteClass.confirmPlaceholder')}
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
          {deleting ? t('components.deleteClass.deleting') : t('components.deleteClass.delete')}
        </Button>
      </CardContent>
    </Card>
  );
}
