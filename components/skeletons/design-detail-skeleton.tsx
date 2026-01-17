import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton loader for DesignDetailSheet panel
 * Mimics the structure of the design detail view
 */
export function DesignDetailSkeleton() {
  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="pb-4 border-b border-gray-100 dark:border-white/10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <Skeleton className="h-7 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-9 w-9 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="py-6 space-y-6">
        {/* Status */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>

        {/* Player Status */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>

        {/* Deadline */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="h-4 w-36" />
        </div>

        {/* Designer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-4 w-28" />
        </div>

        {/* Drive button */}
        <div className="pt-4 border-t border-gray-100 dark:border-white/10">
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
      </div>

      {/* Comments Section */}
      <div className="border-t border-gray-100 dark:border-white/10 pt-6">
        <Skeleton className="h-6 w-28 mb-4" />
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>
    </div>
  );
}
