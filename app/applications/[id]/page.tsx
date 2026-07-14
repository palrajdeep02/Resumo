import { db } from "@/db";
import { applications, matchScores, tailoredDocuments, activityLog } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import StatusSelector from "./status-selector";
import MatchAnalyzer from "./match-analyzer";
import DocumentTailorer from "./document-tailorer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface ApplicationDetailsPageProps {
  params: Promise<{ id: string }>;
}

interface AIScoreResponse {
  overall_score: number;
  matched_skills: string[];
  missing_skills: string[];
  strengths: string[];
  recommendations: string[];
}

export default async function ApplicationDetailsPage({ params }: ApplicationDetailsPageProps) {
  const { id } = await params;
  const userId = await getCurrentUser();
  if (!userId) {
    redirect("/login");
  }

  // Fetch application details, verifying ownership
  const [app] = await db
    .select()
    .from(applications)
    .where(and(eq(applications.id, id), eq(applications.userId, userId)))
    .limit(1);

  if (!app) {
    redirect("/dashboard");
  }

  // Fetch related records
  const [score] = await db
    .select()
    .from(matchScores)
    .where(eq(matchScores.applicationId, id))
    .limit(1);

  const docs = await db
    .select()
    .from(tailoredDocuments)
    .where(eq(tailoredDocuments.applicationId, id))
    .orderBy(desc(tailoredDocuments.createdAt));

  const logs = await db
    .select()
    .from(activityLog)
    .where(eq(activityLog.applicationId, id))
    .orderBy(desc(activityLog.createdAt));

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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Navigation & Header Summary */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between border-b border-grid pb-6 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link href="/dashboard" className="text-xs font-mono text-lead hover:text-ink">
                &larr; BACK TO DASHBOARD
              </Link>
            </div>
            <h1 className="font-serif text-4xl font-medium tracking-tight">
              {app.jobTitle}
            </h1>
            <p className="mt-1 text-lg text-lead font-sans font-medium">
              {app.company}
            </p>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <StatusSelector applicationId={app.id} initialStatus={app.status} />
            <MatchAnalyzer applicationId={app.id} hasScore={!!score} />
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Match Score & Description */}
          <div className="lg:col-span-2 space-y-8">
            {/* Match Score Card */}
            {score && (() => {
              const aiData = score.aiRawResponse as AIScoreResponse | null;
              const matchedSkills = aiData?.matched_skills || [];
              const recommendations = aiData?.recommendations || [];

              return (
                <Card className="rounded-none border-grid shadow-none bg-white">
                  <CardHeader className="border-b border-grid pb-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="font-serif text-xl">Match Quality Evaluation</CardTitle>
                        <CardDescription className="text-xs font-mono">// AI compatibility review</CardDescription>
                      </div>
                      <Badge className="bg-transparent border-crimson text-crimson rounded-none text-lg font-mono px-3 py-0.5">
                        {score.overallScore}% Match
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {/* Overall Match score Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-mono uppercase text-lead">
                        <span>Overall Compatibility Level</span>
                        <span>{score.overallScore}%</span>
                      </div>
                      <div className="h-2 w-full bg-secondary border border-grid">
                        <div className="h-full bg-crimson" style={{ width: `${score.overallScore}%` }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-grid">
                      {/* Strengths */}
                      {Array.isArray(score.strengths) && (
                        <div className="space-y-2">
                          <h4 className="font-mono text-xs uppercase tracking-wider text-lead">// Key Strengths</h4>
                          <ul className="list-disc list-inside text-xs space-y-1 text-ink pl-1">
                            {(score.strengths as string[]).map((strength, index) => (
                              <li key={index}>{strength}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Recommendations */}
                      {recommendations.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-mono text-xs uppercase tracking-wider text-lead">// Tailoring Action Items</h4>
                          <ul className="list-disc list-inside text-xs space-y-1 text-ink pl-1">
                            {recommendations.map((recommendation, index) => (
                              <li key={index} className="text-crimson leading-tight">
                                <span className="text-ink">{recommendation}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-grid">
                      {/* Matched Skills */}
                      {matchedSkills.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-mono text-xs uppercase tracking-wider text-lead">// Matched Skills</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {matchedSkills.map((skill, index) => (
                              <Badge key={index} className="bg-green-50 hover:bg-green-50 text-green-700 border-green-200 rounded-none text-[10px] font-mono">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Skill Gaps */}
                      {Array.isArray(score.skillGaps) && (
                        <div className="space-y-2">
                          <h4 className="font-mono text-xs uppercase tracking-wider text-lead">// Identified Skill Gaps</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {(score.skillGaps as string[]).map((gap, index) => (
                              <Badge key={index} className="bg-red-50 hover:bg-red-50 text-crimson border-red-200 rounded-none text-[10px] font-mono">
                                {gap}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            {/* Job Description Card */}
            <Card className="rounded-none border-grid shadow-none bg-white">
              <CardHeader className="border-b border-grid pb-4">
                <CardTitle className="font-serif text-xl">Job Description</CardTitle>
                <CardDescription className="text-xs font-mono">// Original listing details</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-sm leading-relaxed text-ink whitespace-pre-wrap font-sans max-h-[400px] overflow-y-auto pr-2">
                  {app.jobDescriptionText}
                </div>
              </CardContent>
            </Card>

            {/* Activity Log Card */}
            <Card className="rounded-none border-grid shadow-none bg-white">
              <CardHeader className="border-b border-grid pb-4">
                <CardTitle className="font-serif text-xl">Activity Timeline</CardTitle>
                <CardDescription className="text-xs font-mono">// Historical state logs</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-grid pl-6">
                  {logs.map((log) => (
                    <div key={log.id} className="relative space-y-1">
                      <div className="absolute -left-[29px] top-1.5 size-2.5 rounded-full border border-grid bg-white" />
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs font-mono text-lead uppercase tracking-wider">
                          {log.eventType === "status_change" ? "// status update" : `// ${log.eventType}`}
                        </span>
                        <span className="text-[10px] font-mono text-lead">
                          {new Date(log.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-sm font-sans text-ink">{log.note}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Tailored Documents Editor Workspace */}
          <div className="space-y-8">
            <DocumentTailorer applicationId={app.id} docs={docs} />
          </div>
        </div>
      </main>
    </div>
  );
}
