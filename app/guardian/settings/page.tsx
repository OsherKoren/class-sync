import { getLocale } from "next-intl/server";
import { GuardianSettingsClient } from "@/components/guardian/GuardianSettingsClient";
import { WhatsAppSettings } from "@/components/WhatsAppSettings";
import { getContactSettings } from "@/lib/actions/settings";

export default async function GuardianSettingsPage() {
  const [locale, contactResult] = await Promise.all([getLocale(), getContactSettings()]);
  const contact = "data" in contactResult ? contactResult.data : { phone: null, whatsappOptIn: false };

  return (
    <GuardianSettingsClient initialLocale={locale}>
      <WhatsAppSettings initialPhone={contact.phone} initialOptIn={contact.whatsappOptIn} />
    </GuardianSettingsClient>
  );
}
