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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reason, setReason] = useState("");
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

  async function handleConfirmReject() {
    setRejecting(true);
    const result = await rejectEnrollment(enrollmentId, reason.trim() || undefined);
    if (!("error" in result)) {
      setRejected(true);
      setDialogOpen(false);
      router.refresh();
    }
    setRejecting(false);
  }

  if (approved) {
    return <span className="text-sm text-green-600">{t("components.enrollment.approved")}</span>;
  }

  if (rejected) {
    return <span className="text-sm text-red-600">{t("components.enrollment.rejected")}</span>;
  }

  return (
    <>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleApprove}
          disabled={approving || dialogOpen}
        >
          {approving ? t("components.enrollment.approving") : t("components.enrollment.approve")}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setDialogOpen(true)}
          disabled={approving}
        >
          {t("components.enrollment.reject")}
        </Button>
      </div>

      {dialogOpen && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => !rejecting && setDialogOpen(false)}
        >
          <div
            className="bg-background rounded-xl shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-1">
              {t("components.enrollment.rejectDialogTitle")}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {t("components.enrollment.rejectDialogDesc")}
            </p>
            <label className="text-sm font-medium block mb-1">
              {t("components.enrollment.reasonLabel")}
            </label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              rows={3}
              placeholder={t("components.enrollment.reasonPlaceholder")}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
            />
            <div className="flex justify-end gap-3 mt-4">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={rejecting}
              >
                {t("common.cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmReject}
                disabled={rejecting}
              >
                {rejecting
                  ? t("components.enrollment.rejecting")
                  : t("components.enrollment.confirmReject")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
