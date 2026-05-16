"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { approveEnrollment, rejectEnrollment } from "@/lib/actions/family";

export function EnrollmentManagement({ enrollmentId }: { enrollmentId: string }) {
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [approved, setApproved] = useState(false);
  const [rejected, setRejected] = useState(false);

  async function handleApprove() {
    setApproving(true);
    const result = await approveEnrollment(enrollmentId);
    if (!("error" in result)) {
      setApproved(true);
    }
    setApproving(false);
  }

  async function handleReject() {
    setRejecting(true);
    const result = await rejectEnrollment(enrollmentId);
    if (!("error" in result)) {
      setRejected(true);
    }
    setRejecting(false);
  }

  if (approved) {
    return <span className="text-sm text-green-600">Approved</span>;
  }

  if (rejected) {
    return <span className="text-sm text-red-600">Rejected</span>;
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        onClick={handleApprove}
        disabled={approving || rejecting}
      >
        {approving ? "Approving…" : "Approve"}
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={handleReject}
        disabled={approving || rejecting}
      >
        {rejecting ? "Rejecting…" : "Reject"}
      </Button>
    </div>
  );
}
