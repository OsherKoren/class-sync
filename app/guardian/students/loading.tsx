import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Skeleton className="h-4 w-28 mb-4" />
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-9 w-40" />
              <Skeleton className="h-4 w-52" />
            </div>
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card">
              <div className="p-6 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-28" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-8 w-28" />
              </div>
              <div className="px-6 pb-6">
                <Skeleton className="h-4 w-36" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
