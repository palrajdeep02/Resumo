import { db } from "@/db";
import { applications, matchScores } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ApplicationWithScore = {
  id: string;
  company: string;
  jobTitle: string;
  status: "saved" | "applied" | "interviewing" | "offer" | "rejected";
  updatedAt: Date;
  overallScore: number | null;
};

export default async function DashboardPage() {
  const userId = await getCurrentUser();
  if (!userId) {
    redirect("/login");
  }

  const userApps = await db
    .select({
      id: applications.id,
      company: applications.company,
      jobTitle: applications.jobTitle,
      status: applications.status,
      updatedAt: applications.updatedAt,
      overallScore: matchScores.overallScore,
    })
    .from(applications)
    .leftJoin(matchScores, eq(matchScores.applicationId, applications.id))
    .where(eq(applications.userId, userId))
    .orderBy(desc(applications.updatedAt)) as ApplicationWithScore[];

  const columns: {
    key: "saved" | "applied" | "interviewing" | "offer" | "rejected";
    title: string;
    description: string;
  }[] = [
    { key: "saved", title: "Saved", description: "Drafted applications & ideas" },
    { key: "applied", title: "Applied", description: "Submitted resumes & letters" },
    { key: "interviewing", title: "Interviewing", description: "Active communications" },
    { key: "offer", title: "Offer", description: "Proposals received" },
    { key: "rejected", title: "Rejected", description: "Closed opportunities" },
  ];

  // Group applications by status
  const groupedApps = columns.reduce(
    (acc, col) => {
      acc[col.key] = userApps.filter((app) => app.status === col.key);
      return acc;
    },
    {} as Record<string, ApplicationWithScore[]>
  );

  return (
    <div className="min-h-screen bg-parchment font-sans text-ink">
      {/* Header */}
      <header className="border-b border-grid bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="font-serif text-2xl font-semibold tracking-tight hover:opacity-80">
            Resumo
          </Link>
          <nav className="flex space-x-6 text-sm font-medium">
            <Link href="/dashboard" className="text-crimson">
              Dashboard
            </Link>
            <Link href="/profile" className="hover:text-crimson">
              Profile
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Welcome Section */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between border-b border-grid pb-6 gap-4">
          <div>
            <p className="font-mono text-xs tracking-widest text-lead uppercase mb-1">
              // Control Panel
            </p>
            <h1 className="font-serif text-4xl font-medium tracking-tight">
              Application Tracker
            </h1>
          </div>
          <Link
            href="/applications/new"
            className="inline-flex items-center justify-center bg-crimson hover:bg-crimson/90 text-white font-medium px-6 py-2.5 rounded-none text-sm transition-colors"
          >
            + Track Application
          </Link>
        </div>

        {/* Kanban Board Layout */}
        {/* Kanban Board Layout or Empty State */}
        {userApps.length === 0 ? (
          <div className="border border-grid bg-white p-12 text-center max-w-2xl mx-auto my-12 shadow-sm">
            <span className="font-mono text-xs text-crimson uppercase tracking-widest block mb-2">
              // Dashboard empty
            </span>
            <h2 className="font-serif text-2xl font-semibold mb-2">No Job Applications Tracked</h2>
            <p className="text-sm text-lead mb-8 max-w-md mx-auto leading-relaxed">
              Configure your Base Profile details with your experience and core skills, then track your first target job listing to unlock AI match scoring and document tailoring.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/profile"
                className="inline-flex items-center justify-center border border-grid bg-white hover:bg-parchment/10 text-ink font-medium px-6 py-2.5 rounded-none text-xs font-mono uppercase tracking-wider h-10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crimson"
              >
                Configure Profile
              </Link>
              <Link
                href="/applications/new"
                className="inline-flex items-center justify-center bg-crimson hover:bg-crimson/90 text-white font-medium px-6 py-2.5 rounded-none text-xs font-mono uppercase tracking-wider h-10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crimson"
              >
                + Track New Job
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
            {columns.map((col) => {
              const appsInCol = groupedApps[col.key] || [];
              return (
                <div key={col.key} className="flex flex-col border border-grid bg-white p-4 h-full min-h-[500px]">
                  {/* Column Heading */}
                  <div className="border-b border-grid pb-3 mb-4 flex justify-between items-center">
                    <div>
                      <h2 className="font-serif text-lg font-semibold tracking-tight">
                        {col.title}
                      </h2>
                      <p className="text-[10px] text-lead font-mono mt-0.5 leading-none">
                        {appsInCol.length} {appsInCol.length === 1 ? "record" : "records"}
                      </p>
                    </div>
                    <span className="font-mono text-xs text-lead">// 0{columns.indexOf(col) + 1}</span>
                  </div>

                  {/* Applications list */}
                  <div className="space-y-4 overflow-y-auto">
                    {appsInCol.length === 0 ? (
                      <div className="text-center py-8 border border-dashed border-grid">
                        <p className="text-xs text-lead font-mono">// Empty column</p>
                      </div>
                    ) : (
                      appsInCol.map((app) => (
                        <Link key={app.id} href={`/applications/${app.id}`} className="block group">
                          <Card className="rounded-none border-grid hover:border-crimson shadow-none transition-colors group-hover:bg-parchment/30">
                            <CardHeader className="p-4 pb-2 space-y-1">
                              <div className="flex justify-between items-start gap-2">
                                <span className="text-[10px] font-mono tracking-wider text-lead uppercase max-w-[70%] truncate">
                                  {app.company}
                                </span>
                                {app.overallScore !== null && (
                                  <Badge className="bg-transparent border-crimson/30 text-crimson rounded-none text-[10px] font-mono px-1.5 py-0">
                                    {app.overallScore}% Match
                                  </Badge>
                                )}
                              </div>
                              <CardTitle className="text-sm font-sans font-semibold group-hover:text-crimson transition-colors line-clamp-1">
                                {app.jobTitle}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                              <div className="flex justify-between items-center text-[10px] text-lead font-mono mt-2">
                                <span>UPDATED:</span>
                                <span>
                                  {new Date(app.updatedAt).toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
