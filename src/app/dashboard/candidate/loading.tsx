export default function CandidateDashboardLoading() {
  return (
    <div className="min-h-screen bg-sage py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex justify-between items-end border-b border-line pb-6">
          <div className="space-y-2">
            <div className="h-7 w-48 bg-sand rounded-full" />
            <div className="h-4 w-64 bg-sand/60 rounded-full" />
          </div>
          <div className="h-10 w-24 bg-sand rounded-full" />
        </div>

        {/* Layout Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Matches Skeleton */}
          <div className="lg:col-span-2 space-y-6">
            <div className="h-6 w-32 bg-sand rounded-full" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-line rounded-[14px] p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="h-5 w-40 bg-sand rounded-full" />
                    <div className="h-4 w-28 bg-sand/60 rounded-full" />
                  </div>
                  <div className="h-6 w-16 bg-sand rounded-full" />
                </div>
                <div className="h-4 w-full bg-sand/40 rounded-full" />
                <div className="h-4 w-2/3 bg-sand/40 rounded-full" />
              </div>
            ))}
          </div>

          {/* Sidebar Profile Status Skeleton */}
          <div className="space-y-6">
            <div className="bg-sage-2 rounded-[16px] p-6 space-y-6">
              <div className="space-y-2">
                <div className="h-6 w-24 bg-sand rounded-full" />
                <div className="h-4 w-32 bg-sand/60 rounded-full" />
              </div>
              <div className="h-10 w-full bg-white rounded-[10px] border border-line" />
              <div className="h-24 w-full bg-white rounded-[14px] border border-line" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
