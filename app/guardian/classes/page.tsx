import { getMyStudents } from "@/lib/actions/guardian-dashboard";
import { GuardianClassesClient } from "@/components/guardian/GuardianClassesClient";
import { type StudentClass } from "@/lib/types";

export default async function GuardianClassesPage() {
  const result = await getMyStudents();
  const rawStudents = "error" in result ? [] : result.data;

  const students = rawStudents.map((s) => ({
    id: s.id,
    name: s.name,
    classes: s.enrollments
      .filter((e) => e.status === "ACTIVE")
      .map((e): StudentClass => ({
        classId: e.class.id,
        name: e.class.name,
        subject: e.class.subject,
        type: e.class.type,
        level: e.class.level,
        grade: e.class.grade,
        dayOfWeek: e.class.dayOfWeek,
        startTime: e.class.startTime,
        duration: e.class.duration,
        teacherName: e.class.teacherName,
        enrollmentCount: e.class.enrollmentCount,
        maxCapacity: e.class.maxCapacity,
      })),
  }));

  return <GuardianClassesClient students={students} />;
}
