import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton loader for DesignDetailSheet panel
 * Mimics the structure of the design detail view
 */
export function DesignDetailSkeleton() {
  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto p-6 pb-0">
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

        {/* Comments Header */}
        <div className="mt-6 border-t border-gray-100 dark:border-white/10 pt-4">
          <Skeleton className="h-6 w-28 mb-4" />
          <div className="space-y-4">
             <Skeleton className="h-16 w-3/4 rounded-xl rounded-tl-none ml-0 mr-auto" />
             <Skeleton className="h-12 w-1/2 rounded-xl rounded-tr-none ml-auto mr-0" />
          </div>
        </div>
      </div>

      {/* Fixed Bottom Input Area */}
      <div className="border-t border-gray-100 dark:border-white/10 p-4 mt-auto">
        <div className="flex gap-2 items-end">
          <Skeleton className="h-10 flex-1 rounded-md" />
          <Skeleton className="h-10 w-10 rounded-md" />
        </div>
      </div>
    </div>
  );
}
