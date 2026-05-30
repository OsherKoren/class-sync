import { getLocale } from "next-intl/server";
import { TeacherSettingsClient } from "@/components/teacher/TeacherSettingsClient";

export default async function TeacherSettingsPage() {
  const locale = await getLocale();
  return <TeacherSettingsClient initialLocale={locale} />;
}
