"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { updateContactSettings } from "@/lib/actions/settings";

export function WhatsAppSettings({
  initialPhone,
  initialOptIn,
}: {
  initialPhone: string | null;
  initialOptIn: boolean;
}) {
  const t = useTranslations("whatsapp");
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [optIn, setOptIn] = useState(initialOptIn);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    const result = await updateContactSettings({ phone, whatsappOptIn: optIn });
    setSaving(false);
    if ("error" in result) {
      setError(result.error);
    } else {
      setSaved(true);
    }
  }

  async function handleToggle(checked: boolean) {
    setOptIn(checked);
    setSaved(false);
    setError(null);
    const result = await updateContactSettings({ phone, whatsappOptIn: checked });
    if ("error" in result) {
      setError(result.error);
      setOptIn(!checked);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{t("description")}</p>

        <div className="space-y-1">
          <Label htmlFor="phone">{t("phone")}</Label>
          <div className="flex gap-2">
            <Input
              id="phone"
              type="tel"
              placeholder={t("phonePlaceholder")}
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setSaved(false);
              }}
              className="max-w-xs"
            />
            <Button
              onClick={handleSave}
              disabled={saving}
              variant="outline"
              size="sm"
            >
              {saving ? t("saving") : t("save")}
            </Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {saved && <p className="text-sm text-green-600">{t("saved")}</p>}
        </div>

        <div className="flex items-center gap-3">
          <Switch
            id="whatsapp-optin"
            checked={optIn}
            onCheckedChange={handleToggle}
            disabled={!phone}
          />
          <Label htmlFor="whatsapp-optin" className="text-sm">
            {t("optIn")}
          </Label>
        </div>
        {!phone && (
          <p className="text-xs text-muted-foreground">{t("phoneRequired")}</p>
        )}
      </CardContent>
    </Card>
  );
}
