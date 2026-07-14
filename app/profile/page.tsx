import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import ProfileForm from "./profile-form";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const userId = await getCurrentUser();
  if (!userId) {
    redirect("/login");
  }

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  return (
    <div className="min-h-screen bg-parchment font-sans text-ink">
      {/* Header */}
      <header className="border-b border-grid bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="font-serif text-2xl font-semibold tracking-tight hover:opacity-80">
            Resumo
          </Link>
          <nav className="flex space-x-6 text-sm font-medium">
            <Link href="/dashboard" className="hover:text-crimson">
              Dashboard
            </Link>
            <Link href="/profile" className="text-crimson">
              Profile
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8 flex justify-between items-end border-b border-grid pb-4">
          <div>
            <p className="font-mono text-xs tracking-widest text-lead uppercase mb-1">
              // Setup Candidate Details
            </p>
            <h1 className="font-serif text-4xl font-medium tracking-tight">
              Base Profile
            </h1>
          </div>
          <Link href="/dashboard" className="text-sm font-medium text-lead hover:text-ink">
            &larr; Back to Dashboard
          </Link>
        </div>

        <ProfileForm initialData={profile || null} />
      </main>
    </div>
  );
}
