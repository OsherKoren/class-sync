import { getLocale } from "next-intl/server";
import { StudentSettingsClient } from "@/components/student/StudentSettingsClient";

export default async function StudentSettingsPage() {
  const locale = await getLocale();
  return <StudentSettingsClient initialLocale={locale} />;
}
