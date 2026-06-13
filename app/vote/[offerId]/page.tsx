import { getRescheduleOffer } from "@/lib/actions/reschedule";
import { redirect } from "next/navigation";
import { VoteClient } from "@/components/VoteClient";
import { getTranslations } from "next-intl/server";

export default async function VotePage({
  params,
}: {
  params: Promise<{ offerId: string }>;
}) {
  const { offerId } = await params;
  const [result, t] = await Promise.all([getRescheduleOffer(offerId), getTranslations()]);

  if ("error" in result) redirect("/login");

  const offer = result.data;
  if (offer.isTeacher) redirect(`/teacher/reschedule/${offerId}/results`);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-bold mb-2">{t("teacher.vote.title")}</h1>
        <p className="text-muted-foreground mb-2">{offer.lessonSession.className}</p>
        <p className="text-sm text-muted-foreground mb-8">{t("teacher.vote.intro")}</p>
        <VoteClient offer={offer} />
      </div>
    </div>
  );
}
