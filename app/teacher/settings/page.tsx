import { getLocale } from "next-intl/server";
import { TeacherSettingsClient } from "@/components/teacher/TeacherSettingsClient";
import { CalendarSettings } from "@/components/teacher/CalendarSettings";
import { getCalendarStatus } from "@/lib/actions/calendar";

export default async function TeacherSettingsPage() {
  const [locale, calendarResult] = await Promise.all([
    getLocale(),
    getCalendarStatus(),
  ]);

  const calendarStatus = "data" in calendarResult ? calendarResult.data : null;

  return (
    <TeacherSettingsClient initialLocale={locale}>
      <CalendarSettings initialStatus={calendarStatus} />
    </TeacherSettingsClient>
  );
}
