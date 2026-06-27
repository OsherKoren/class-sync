import { getLocale } from "next-intl/server";
import { TeacherSettingsClient } from "@/components/teacher/TeacherSettingsClient";
import { CalendarSettings } from "@/components/teacher/CalendarSettings";
import { WhatsAppSettings } from "@/components/WhatsAppSettings";
import { getCalendarStatus } from "@/lib/actions/calendar";
import { getContactSettings } from "@/lib/actions/settings";

export default async function TeacherSettingsPage() {
  const [locale, calendarResult, contactResult] = await Promise.all([
    getLocale(),
    getCalendarStatus(),
    getContactSettings(),
  ]);

  const calendarStatus = "data" in calendarResult ? calendarResult.data : null;
  const contact = "data" in contactResult ? contactResult.data : { phone: null, whatsappOptIn: false };

  return (
    <TeacherSettingsClient initialLocale={locale}>
      <CalendarSettings initialStatus={calendarStatus} />
      <WhatsAppSettings initialPhone={contact.phone} initialOptIn={contact.whatsappOptIn} />
    </TeacherSettingsClient>
  );
}
