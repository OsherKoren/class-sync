import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getTeacherClasses } from "@/lib/actions/class";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { ScheduleView } from "@/components/schedule/ScheduleView";

export default async function ClassesPage() {
  const [result, session, t] = await Promise.all([
    getTeacherClasses(),
    auth(),
    getTranslations(),
  ]);
  const teacherName = session?.user?.name ?? null;

  if ("error" in result) {
    return (
      <div className="p-8">
        <p className="text-destructive">{result.error}</p>
      </div>
    );
  }

  const classes = result.data;

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t("teacher.classes.title")}</h1>
            <p className="text-muted-foreground">{t("teacher.classes.subtitle")}</p>
          </div>
          <Link href="/teacher/classes/new">
            <Button>{t("teacher.classes.createClass")}</Button>
          </Link>
        </div>

        {classes.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                {t("teacher.classes.noClasses")}{" "}
                <Link href="/teacher/classes/new" className="underline underline-offset-4">
                  {t("teacher.classes.createFirst")}
                </Link>
              </p>
            </CardContent>
          </Card>
        ) : (
          <ScheduleView classes={classes} teacherName={teacherName} allowCreate />
        )}
      </div>
    </div>
  );
}
