"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClass } from "@/lib/actions/class";

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function CreateClassPage() {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [type, setType] = useState("GROUP");
  const [dayOfWeek, setDayOfWeek] = useState("0");
  const [startTime, setStartTime] = useState("16:00");
  const [duration, setDuration] = useState("45");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Generate 15-minute intervals for the dropdown
  const timeOptions = Array.from({ length: 96 }, (_, i) => {
    const hours = Math.floor(i / 4);
    const minutes = (i % 4) * 15;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await createClass({
      name,
      subject,
      type,
      dayOfWeek: parseInt(dayOfWeek),
      startTime,
      duration: parseInt(duration),
    });

    if ("error" in result) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push("/teacher/classes");
    router.refresh();
  }

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create class</h1>
          <p className="text-muted-foreground">
            Set up a new class for your students
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">Class name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Math 101"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="e.g., Mathematics"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="type">Class type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GROUP">Group</SelectItem>
                      <SelectItem value="PRIVATE">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dayOfWeek">Day</Label>
                  <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                    <SelectTrigger id="dayOfWeek">
                      <span>{dayNames[parseInt(dayOfWeek)]}</span>
                    </SelectTrigger>
                    <SelectContent>
                      {dayNames.map((day, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="startTime">Start time (24-hour format)</Label>
                  <div className="flex gap-2">
                    <Select value={startTime} onValueChange={setStartTime}>
                      <SelectTrigger className="flex-1" id="startTime">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-32"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Choose from 15-min intervals or type custom time
                  </p>
                </div>

                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="15"
                    step="15"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex gap-4">
                <Button type="submit" disabled={loading || !name || !subject}>
                  {loading ? "Creating…" : "Create class"}
                </Button>
                <Link href="/teacher/classes">
                  <Button type="button" variant="outline" disabled={loading}>
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
