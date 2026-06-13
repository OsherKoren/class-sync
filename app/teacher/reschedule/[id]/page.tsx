import { RescheduleForm } from "@/components/teacher/RescheduleForm";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

export default async function ReschedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: sessionId } = await params;
  const [session, t] = await Promise.all([auth(), getTranslations()]);

  if (!session?.user?.id || session.user.role !== "TEACHER") redirect("/login");

  const lessonSession = await db.lessonSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      scheduledAt: true,
      class: { select: { id: true, name: true, teacherId: true } },
    },
  });

  if (!lessonSession || lessonSession.class.teacherId !== session.user.id) {
    redirect("/teacher/classes");
  }

  const existingOffer = await db.rescheduleOffer.findFirst({
    where: { lessonSessionId: sessionId, status: "OPEN" },
    select: { id: true },
  });

  if (existingOffer) redirect(`/teacher/reschedule/${existingOffer.id}/results`);

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <p className="text-sm text-muted-foreground mb-4">
          <a href={`/teacher/classes/${lessonSession.class.id}`} className="hover:underline">
            {t("teacher.reschedule.backToClass")}
          </a>
        </p>
        <h1 className="text-3xl font-bold mb-2">{t("teacher.reschedule.title")}</h1>
        <p className="text-muted-foreground mb-6">{t("teacher.reschedule.subtitle")}</p>
        <p className="text-sm font-medium mb-6">
          {t("teacher.reschedule.sessionLabel")}:{" "}
          <span className="text-muted-foreground">
            {lessonSession.class.name} —{" "}
            {new Date(lessonSession.scheduledAt).toLocaleDateString(undefined, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </p>
        <RescheduleForm
          sessionId={sessionId}
          classId={lessonSession.class.id}
        />
      </div>
    </div>
  );
}
