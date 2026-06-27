import { getRescheduleOffer } from "@/lib/actions/reschedule";
import { redirect } from "next/navigation";
import { ResolveOfferClient } from "@/components/teacher/ResolveOfferClient";
import { getTranslations } from "next-intl/server";

export default async function RescheduleResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: offerId } = await params;
  const [result, t] = await Promise.all([getRescheduleOffer(offerId), getTranslations()]);

  if ("error" in result) redirect("/teacher/classes");

  const offer = result.data;
  if (!offer.isTeacher) redirect("/teacher/classes");

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <p className="text-sm text-muted-foreground mb-4">
          <a href={`/teacher/classes/${offer.lessonSession.classId}`} className="hover:underline">
            {t("teacher.reschedule.backToClass")}
          </a>
        </p>
        <h1 className="text-3xl font-bold mb-2">{t("teacher.reschedule.resultsTitle")}</h1>
        <p className="text-muted-foreground mb-6">
          {offer.lessonSession.className}
        </p>
        <ResolveOfferClient offer={offer} />
      </div>
    </div>
  );
}
