"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updateClass } from "@/lib/actions/class";

export function ToggleOpenEnrollment({
  classId,
  isOpen: initialIsOpen,
}: {
  classId: string;
  isOpen: boolean;
}) {
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [loading, setLoading] = useState(false);

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
        <CardTitle>Open Enrollment</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {isOpen
              ? "This class is open for student self-enrollment requests"
              : "Only you can enroll students in this class"}
          </p>
        </div>
        <Button onClick={handleToggle} disabled={loading}>
          {isOpen ? "Close Enrollment" : "Open Enrollment"}
        </Button>
      </CardContent>
    </Card>
  );
}
