import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SessionCardProps {
  name: string;
  subject: string;
  startTime: string;
  duration: number;
  status: "ACTIVE" | "PENDING";
  childName?: string;
  dayLabel: string;
  minutesLabel: string;
  activeLabel: string;
  pendingLabel: string;
}

export function SessionCard({
  name,
  subject,
  startTime,
  duration,
  status,
  childName,
  dayLabel,
  minutesLabel,
  activeLabel,
  pendingLabel,
}: SessionCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-base truncate">{name}</CardTitle>
            {childName && (
              <p className="text-xs text-muted-foreground mt-0.5">{childName}</p>
            )}
          </div>
          <span
            className={cn(
              "shrink-0 text-xs px-2 py-0.5 rounded-full font-medium",
              status === "ACTIVE"
                ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100"
                : "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100"
            )}
          >
            {status === "ACTIVE" ? activeLabel : pendingLabel}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{subject}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {dayLabel} · {startTime} · {duration} {minutesLabel}
        </p>
      </CardContent>
    </Card>
  );
}
