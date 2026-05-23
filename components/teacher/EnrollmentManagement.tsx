"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { approveEnrollment, rejectEnrollment } from "@/lib/actions/guardian";
import { useTranslations } from "next-intl";

export function EnrollmentManagement({ enrollmentId }: { enrollmentId: string }) {
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [approved, setApproved] = useState(false);
  const [rejected, setRejected] = useState(false);
  const t = useTranslations();
  const router = useRouter();

  async function handleApprove() {
    setApproving(true);
    const result = await approveEnrollment(enrollmentId);
    if (!("error" in result)) {
      setApproved(true);
      router.refresh();
    }
    setApproving(false);
  }

  async function handleReject() {
    setRejecting(true);
    const result = await rejectEnrollment(enrollmentId);
    if (!("error" in result)) {
      setRejected(true);
      router.refresh();
    }
    setRejecting(false);
  }

  if (approved) {
    return <span className="text-sm text-green-600">{t('components.enrollment.approved')}</span>;
  }

  if (rejected) {
    return <span className="text-sm text-red-600">{t('components.enrollment.rejected')}</span>;
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        onClick={handleApprove}
        disabled={approving || rejecting}
      >
        {approving ? t('components.enrollment.approving') : t('components.enrollment.approve')}
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={handleReject}
        disabled={approving || rejecting}
      >
        {rejecting ? t('components.enrollment.rejecting') : t('components.enrollment.reject')}
      </Button>
    </div>
  );
}
