"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getOpenClasses, requestEnrollment } from "@/lib/actions/student";

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

type ClassInfo = {
  id: string;
  name: string;
  subject: string;
  dayOfWeek: number;
  startTime: string;
  duration: number;
  type: string;
};

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requesting, setRequesting] = useState<string | null>(null);
  const [requested, setRequested] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadClasses() {
      const result = await getOpenClasses();
      if ("error" in result) {
        setError(result.error);
      } else {
        setClasses(result.data);
      }
      setLoading(false);
    }
    loadClasses();
  }, []);

  async function handleRequest(classId: string) {
    setRequesting(classId);
    const result = await requestEnrollment(classId);

    if ("error" in result) {
      setError(result.error);
    } else {
      setRequested((prev) => new Set([...prev, classId]));
    }
    setRequesting(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <p>Loading classes...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/student/dashboard" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">
            ← Back to dashboard
          </Link>
          <h1 className="text-3xl font-bold mb-2">Available Classes</h1>
          <p className="text-muted-foreground">
            Request to join any of these open classes
          </p>
        </div>

        {error && <p className="text-sm text-destructive mb-4">{error}</p>}

        {classes.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No open classes available at the moment.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {classes.map((cls) => (
              <Card key={cls.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{cls.name}</CardTitle>
                      <CardDescription>{cls.subject}</CardDescription>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-medium">{cls.type}</p>
                      <p className="text-muted-foreground">
                        {dayNames[cls.dayOfWeek]} at {cls.startTime}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {cls.duration} minutes per session
                  </p>
                  <Button
                    onClick={() => handleRequest(cls.id)}
                    disabled={requesting === cls.id || requested.has(cls.id)}
                  >
                    {requested.has(cls.id)
                      ? "Requested"
                      : requesting === cls.id
                        ? "Requesting…"
                        : "Request to join"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
