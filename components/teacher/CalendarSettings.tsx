"use client";

import { useState } from "react";
import { Calendar, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listTeacherCalendars, setDesignatedCalendar } from "@/lib/actions/calendar";
import { cn } from "@/lib/utils";

type CalendarItem = { id: string; summary: string; primary: boolean };

interface Props {
  initialStatus: { connected: boolean; designatedCalendarId: string | null } | null;
}

export function CalendarSettings({ initialStatus }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [calendars, setCalendars] = useState<CalendarItem[]>([]);
  const [picking, setPicking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePickCalendar() {
    setLoading(true);
    setError(null);
    const res = await listTeacherCalendars();
    setLoading(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setCalendars(res.data);
    setPicking(true);
  }

  async function handleSelect(calendarId: string) {
    setSaving(calendarId);
    setError(null);
    const res = await setDesignatedCalendar(calendarId);
    setSaving(null);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setStatus((s) => s ? { ...s, designatedCalendarId: calendarId } : s);
    setPicking(false);
  }

  const selectedCalendar = calendars.find((c) => c.id === status?.designatedCalendarId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Google Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!status?.connected ? (
          <p className="text-sm text-muted-foreground">
            Sign in with Google to connect your calendar.
          </p>
        ) : (
          <>
            {status.designatedCalendarId && !picking ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="font-medium">
                    {selectedCalendar?.summary ?? status.designatedCalendarId}
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={handlePickCalendar} disabled={loading}>
                  {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Change"}
                </Button>
              </div>
            ) : !picking ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  No calendar selected
                </div>
                <Button size="sm" onClick={handlePickCalendar} disabled={loading}>
                  {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Pick a calendar"}
                </Button>
              </div>
            ) : null}

            {picking && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Select a calendar to sync classes to:</p>
                {calendars.map((cal) => (
                  <div
                    key={cal.id}
                    className={cn(
                      "flex items-center justify-between rounded-md border px-3 py-2",
                      cal.id === status?.designatedCalendarId && "border-primary bg-primary/5",
                    )}
                  >
                    <div className="text-sm">
                      <span className="font-medium">{cal.summary}</span>
                      {cal.primary && (
                        <span className="ms-2 text-xs text-muted-foreground">(primary)</span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant={cal.id === status?.designatedCalendarId ? "default" : "outline"}
                      onClick={() => handleSelect(cal.id)}
                      disabled={saving !== null}
                    >
                      {saving === cal.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : cal.id === status?.designatedCalendarId ? (
                        "Selected"
                      ) : (
                        "Select"
                      )}
                    </Button>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => setPicking(false)}
                >
                  Cancel
                </Button>
              </div>
            )}
          </>
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
