"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updateClass } from "@/lib/actions/class";
import { useTranslations } from "next-intl";

export function ToggleOpenEnrollment({
  classId,
  isOpen: initialIsOpen,
  maxCapacity,
  enrollmentCount,
}: {
  classId: string;
  isOpen: boolean;
  maxCapacity?: number | null;
  enrollmentCount: number;
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

  const isFull = maxCapacity !== null && maxCapacity !== undefined && enrollmentCount >= maxCapacity;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{t('components.openEnrollment.title')}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <div>
          {maxCapacity && (
            <p className="text-sm font-medium mb-1">
              {t('components.openEnrollment.capacityInfo', { current: enrollmentCount, max: maxCapacity })}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            {isOpen
              ? t('components.openEnrollment.openDesc')
              : isFull
                ? t('components.openEnrollment.autoClosedNote')
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
