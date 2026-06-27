"use client";

import { Download, BellOff, BellRing } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { usePushSubscription } from "@/hooks/usePushSubscription";

export function InstallButton() {
  const t = useTranslations("pwa");
  const { installState, install } = usePwaInstall();
  const { subscribed, loading, supported, subscribe, unsubscribe } = usePushSubscription();

  const showInstall = installState !== "unsupported";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("settingsTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {showInstall && (
          <>
            {installState === "installed" ? (
              <p className="text-sm text-muted-foreground">{t("alreadyInstalled")}</p>
            ) : installState === "ios" ? (
              <p className="text-sm text-muted-foreground">{t("iosInstall")}</p>
            ) : (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={install}
                disabled={installState === "installing"}
              >
                <Download className="h-4 w-4" />
                {t("installButton")}
              </Button>
            )}
          </>
        )}

        {supported && (
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={subscribed ? unsubscribe : subscribe}
            disabled={loading}
          >
            {subscribed ? (
              <>
                <BellRing className="h-4 w-4" />
                {t("notificationsEnabled")}
              </>
            ) : (
              <>
                <BellOff className="h-4 w-4" />
                {t("enableNotifications")}
              </>
            )}
          </Button>
        )}

        {!supported && !showInstall && (
          <p className="text-sm text-muted-foreground">{t("notSupported")}</p>
        )}
      </CardContent>
    </Card>
  );
}
