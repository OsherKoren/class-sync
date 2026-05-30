import { CreateClassForm } from "@/components/teacher/CreateClassForm";

export default async function CreateClassPage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string; startTime?: string }>;
}) {
  const params = await searchParams;
  const defaultDay = params.day !== undefined ? parseInt(params.day) : 0;
  const defaultStartTime = params.startTime ?? "16:00";

  return (
    <CreateClassForm
      defaultDay={isNaN(defaultDay) ? 0 : Math.max(0, Math.min(6, defaultDay))}
      defaultStartTime={defaultStartTime}
    />
  );
}
