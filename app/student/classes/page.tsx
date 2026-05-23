import { getMyEnrolledClasses, getOpenClasses, getMyAbsences } from "@/lib/actions/student";
import { StudentClassesClient } from "@/components/student/StudentClassesClient";

export default async function ClassesPage() {
  const [enrolledResult, openResult, absencesResult] = await Promise.all([
    getMyEnrolledClasses(),
    getOpenClasses(),
    getMyAbsences(),
  ]);

  const enrolledClasses = "data" in enrolledResult ? enrolledResult.data : [];
  const openClasses = "data" in openResult ? openResult.data : [];
  const initialAbsences = "data" in absencesResult ? absencesResult.data : [];

  return (
    <StudentClassesClient
      enrolledClasses={enrolledClasses}
      openClasses={openClasses}
      initialAbsences={initialAbsences}
    />
  );
}
