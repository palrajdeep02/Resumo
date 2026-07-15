export default function PublicJobsLoading() {
  return (
    <div className="min-h-screen bg-sage py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex justify-between items-end border-b border-line pb-6">
          <div className="space-y-2">
            <div className="h-7 w-48 bg-sand rounded-full" />
            <div className="h-4 w-64 bg-sand/60 rounded-full" />
          </div>
        </div>

        {/* Filters Form Skeleton */}
        <div className="bg-sage-2 rounded-[16px] p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-14 bg-white border border-line rounded-[10px]" />
          <div className="h-14 bg-white border border-line rounded-[10px]" />
          <div className="h-14 bg-white border border-line rounded-[10px]" />
          <div className="h-14 bg-white border border-line rounded-[10px]" />
        </div>

        {/* Listings Grid Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-line rounded-[14px] p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="h-5 w-56 bg-sand rounded-full" />
                  <div className="h-4 w-36 bg-sand/60 rounded-full" />
                </div>
                <div className="h-8 w-24 bg-sand rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
