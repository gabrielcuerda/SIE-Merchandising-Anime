import { Panel } from "@/components/admin/ui/panel";

export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-8 w-48 animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-800" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800"
          />
        ))}
      </div>
      <Panel>
        <div className="h-64 animate-pulse bg-neutral-100 dark:bg-neutral-900" />
      </Panel>
    </div>
  );
}
