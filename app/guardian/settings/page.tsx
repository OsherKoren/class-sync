import { getLocale } from "next-intl/server";
import { GuardianSettingsClient } from "@/components/guardian/GuardianSettingsClient";

export default async function GuardianSettingsPage() {
  const locale = await getLocale();
  return <GuardianSettingsClient initialLocale={locale} />;
}
