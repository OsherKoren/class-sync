import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTeacherClasses } from "@/lib/actions/class";
import { getTranslations } from "next-intl/server";

export default async function ClassesPage() {
  const result = await getTeacherClasses();
  const t = await getTranslations();

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
            <h1 className="text-3xl font-bold mb-2">{t('teacher.classes.title')}</h1>
            <p className="text-muted-foreground">
              {t('teacher.classes.subtitle')}
            </p>
          </div>
          <Link href="/teacher/classes/new">
            <Button>{t('teacher.classes.createClass')}</Button>
          </Link>
        </div>

        {classes.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                {t('teacher.classes.noClasses')}{" "}
                <Link
                  href="/teacher/classes/new"
                  className="underline underline-offset-4"
                >
                  {t('teacher.classes.createFirst')}
                </Link>
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {classes.map((cls) => (
              <Link key={cls.id} href={`/teacher/classes/${cls.id}`}>
                <Card className="hover:bg-accent transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{cls.name}</CardTitle>
                        <CardDescription>{cls.subject}</CardDescription>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-medium">{cls.type}</p>
                        {(cls.level || cls.grade) && (
                          <p className="text-muted-foreground">
                            {cls.grade && <span>{cls.grade}</span>}
                            {cls.grade && cls.level && <span> · </span>}
                            {cls.level && (
                              <span className="capitalize">
                                {cls.level.charAt(0) + cls.level.slice(1).toLowerCase()}
                              </span>
                            )}
                          </p>
                        )}
                        <p className="text-muted-foreground">
                          {t(`days.${cls.dayOfWeek}` as `days.${number}`)} at {cls.startTime}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {cls.enrollmentCount}{" "}
                      {cls.enrollmentCount === 1 ? t('common.student') : t('common.students')}{" "}
                      enrolled • {cls.duration} {t('common.minutesPerSession')}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
