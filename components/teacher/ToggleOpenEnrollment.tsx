"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updateClass } from "@/lib/actions/class";
import { useTranslations } from "next-intl";

export function ToggleOpenEnrollment({
  classId,
  isOpen: initialIsOpen,
}: {
  classId: string;
  isOpen: boolean;
}) {
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [loading, setLoading] = useState(false);
  const t = useTranslations();

  async function handleToggle() {
    setLoading(true);
    const result = await updateClass(classId, { isOpen: !isOpen });

    if (!("error" in result)) {
      setIsOpen(!isOpen);
    }
    setLoading(false);
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{t('components.openEnrollment.title')}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {isOpen
              ? t('components.openEnrollment.openDesc')
              : t('components.openEnrollment.closedDesc')}
          </p>
        </div>
        <Button onClick={handleToggle} disabled={loading}>
          {isOpen ? t('components.openEnrollment.closeBtn') : t('components.openEnrollment.openBtn')}
        </Button>
      </CardContent>
    </Card>
  );
}
