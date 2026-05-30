import { getMyEnrolledClasses, getOpenClasses, getMyAbsences, getStudentEnrollments } from "@/lib/actions/student";
import { StudentClassesClient } from "@/components/student/StudentClassesClient";

export default async function ClassesPage() {
  const [enrolledResult, openResult, absencesResult, enrollmentsResult] = await Promise.all([
    getMyEnrolledClasses(),
    getOpenClasses(),
    getMyAbsences(),
    getStudentEnrollments(),
  ]);

  const enrolledClasses = "data" in enrolledResult ? enrolledResult.data : [];
  const openClasses = "data" in openResult ? openResult.data : [];
  const initialAbsences = "data" in absencesResult ? absencesResult.data : [];
  const initialPendingIds = "data" in enrollmentsResult
    ? enrollmentsResult.data.filter((e) => e.status === "PENDING").map((e) => e.classId)
    : [];

  const initialRejectedEnrollments = "data" in enrollmentsResult
    ? enrollmentsResult.data
        .filter((e) => e.status === "REJECTED")
        .map((e) => ({
          classId: e.classId,
          className: e.class.name,
          classSubject: e.class.subject,
          rejectionReason: e.rejectionReason,
        }))
    : [];

  return (
    <StudentClassesClient
      enrolledClasses={enrolledClasses}
      openClasses={openClasses}
      initialAbsences={initialAbsences}
      initialPendingIds={initialPendingIds}
      initialRejectedEnrollments={initialRejectedEnrollments}
    />
  );
}
