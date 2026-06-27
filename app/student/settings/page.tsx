import { getLocale } from "next-intl/server";
import { StudentSettingsClient } from "@/components/student/StudentSettingsClient";
import { WhatsAppSettings } from "@/components/WhatsAppSettings";
import { getContactSettings } from "@/lib/actions/settings";

export default async function StudentSettingsPage() {
  const [locale, contactResult] = await Promise.all([getLocale(), getContactSettings()]);
  const contact = "data" in contactResult ? contactResult.data : { phone: null, whatsappOptIn: false };

  return (
    <StudentSettingsClient initialLocale={locale}>
      <WhatsAppSettings initialPhone={contact.phone} initialOptIn={contact.whatsappOptIn} />
    </StudentSettingsClient>
  );
}
