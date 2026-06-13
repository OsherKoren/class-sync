"use client";

import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { updateLocale, updateTheme } from "@/lib/actions/settings";
import { useState } from "react";
import { LogOut, Sun, Moon, Monitor } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface UserMenuProps {
  name: string | null;
  email: string | null;
  image?: string | null;
  currentLocale: string;
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

const THEMES = [
  { value: "light", Icon: Sun },
  { value: "dark", Icon: Moon },
  { value: "system", Icon: Monitor },
] as const;

export function UserMenu({ name, email, image, currentLocale }: UserMenuProps) {
  const t = useTranslations("common");
  const { theme, setTheme } = useTheme();
  const [locale, setLocale] = useState(currentLocale);
  const [savingLocale, setSavingLocale] = useState(false);

  async function switchLocale(next: "he" | "en") {
    if (next === locale || savingLocale) return;
    setSavingLocale(true);
    setLocale(next);
    await updateLocale(next);
    window.location.reload();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer">
        <Avatar>
          {image && <AvatarImage src={image} alt={name ?? ""} />}
          <AvatarFallback>{getInitials(name)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="min-w-[220px]">
        {/* Identity */}
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium text-foreground">{name}</p>
          {email && <p className="text-xs text-muted-foreground">{email}</p>}
        </div>

        <DropdownMenuSeparator />

        {/* Language */}
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-xs text-muted-foreground">{t("language")}</span>
          <div className="flex items-center border border-border rounded-md overflow-hidden text-xs">
            {(["he", "en"] as const).map((loc) => (
              <button
                key={loc}
                onClick={() => switchLocale(loc)}
                disabled={savingLocale}
                className={cn(
                  "px-2.5 py-1 transition-colors",
                  locale === loc
                    ? "bg-primary text-primary-foreground font-medium"
                    : "bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {loc === "he" ? "עב" : "EN"}
              </button>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-xs text-muted-foreground">{t("theme")}</span>
          <div className="flex items-center gap-0.5">
            {THEMES.map(({ value, Icon }) => (
              <button
                key={value}
                onClick={() => { setTheme(value); updateTheme(value).catch(console.error); }}
                title={t(`theme${value.charAt(0).toUpperCase() + value.slice(1)}` as "themeLight" | "themeDark" | "themeSystem")}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  theme === value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Sign out */}
        <DropdownMenuItem
          variant="destructive"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut />
          {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
