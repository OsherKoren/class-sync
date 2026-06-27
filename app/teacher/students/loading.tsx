import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-2">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-9 w-36" />
        </div>
        <Skeleton className="h-10 w-full mb-8 rounded-md" />
        <div className="grid gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-36" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
