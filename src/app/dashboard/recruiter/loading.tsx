export default function RecruiterDashboardLoading() {
  return (
    <div className="min-h-screen bg-sage py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex justify-between items-end border-b border-line pb-6">
          <div className="space-y-2">
            <div className="h-7 w-48 bg-sand rounded-full" />
            <div className="h-4 w-64 bg-sand/60 rounded-full" />
          </div>
          <div className="flex space-x-2">
            <div className="h-10 w-24 bg-sand rounded-full" />
            <div className="h-10 w-28 bg-sand rounded-full" />
          </div>
        </div>

        {/* Layout Skeleton */}
        <div className="space-y-6">
          <div className="h-6 w-32 bg-sand rounded-full" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-line rounded-[14px] p-6 flex items-center justify-between">
              <div className="space-y-2 flex-grow">
                <div className="h-5 w-48 bg-sand rounded-full" />
                <div className="h-4 w-32 bg-sand/60 rounded-full" />
              </div>
              <div className="flex space-x-4">
                <div className="h-8 w-24 bg-sand rounded-full" />
                <div className="h-8 w-20 bg-sand/60 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
