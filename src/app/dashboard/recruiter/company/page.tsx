"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getCompanyProfile, updateCompanyProfile } from "@/server/recruiter-actions"
import { toast } from "sonner"

export default function RecruiterCompanyPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)

  // Form states
  const [companyId, setCompanyId] = useState("")
  const [name, setName] = useState("")
  const [website, setWebsite] = useState("")
  const [description, setDescription] = useState("")
  const [logoUrl, setLogoUrl] = useState("")

  // UI states
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Fetch company
  useEffect(() => {
    async function load() {
      const res = await getCompanyProfile()
      if (res.error) {
        setError(res.error)
      } else if (res.company) {
        const c = res.company
        setCompanyId(c.id)
        setName(c.name)
        setWebsite(c.website || "")
        setDescription(c.description || "")
        setLogoUrl(c.logoUrl || "")
      }
      setLoading(false)
    }
    load()
  }, [])

  // Logo upload handler
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()

      if (res.ok && data.url) {
        setLogoUrl(data.url)
        toast.success("Logo uploaded successfully!")
      } else {
        toast.error(data.error || "Failed to upload logo")
      }
    } catch (err) {
      console.error(err)
      toast.error("Logo upload failed")
    } finally {
      setUploading(false)
    }
  }

  // Save changes
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!name.trim()) {
      toast.error("Company name is required")
      return
    }

    startTransition(async () => {
      const res = await updateCompanyProfile({
        name,
        website,
        logoUrl,
        description,
      })

      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("Company profile saved successfully!")
        router.refresh()
      }
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sage text-forest-soft">
        <div className="flex items-center space-x-2">
          <span className="w-6 h-6 border-2 border-forest-soft border-t-moss rounded-full animate-spin" />
          <span>Loading Company...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-sage py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-end pb-4 border-b border-line gap-4">
          <div>
            <h1 className="text-3xl font-serif font-medium text-forest">
              Edit Company Profile
            </h1>
            <p className="text-sm text-forest-soft mt-1">
              Configure your organization settings and recruit code
            </p>
          </div>
          <Link
            href="/dashboard/recruiter"
            className="px-5 py-2 text-xs font-semibold border border-forest hover:bg-sage-2 text-forest rounded-full transition-colors shrink-0"
          >
            Dashboard
          </Link>
        </div>

        {/* Share Invite Code Box */}
        {companyId && (
          <div className="p-4 bg-moss/10 border border-moss rounded-[14px] space-y-2">
            <h3 className="text-sm font-bold text-moss-dark">Share Company Invite Code</h3>
            <p className="text-xs text-forest-soft">
              Provide this code/UUID to new recruiters so they can join your company profile during signup:
            </p>
            <div className="flex items-center space-x-2">
              <code className="px-3 py-1.5 bg-white border border-line rounded-[8px] text-xs select-all font-mono text-forest font-semibold block flex-grow truncate">
                {companyId}
              </code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(companyId)
                  toast.success("Invite code copied to clipboard!")
                }}
                className="px-4 py-1.5 border border-forest rounded-full text-xs font-semibold text-forest hover:bg-sage-2 transition-colors cursor-pointer"
              >
                Copy
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {error && (
            <div className="p-4 text-xs text-coral-dark bg-coral/10 border border-coral rounded-[10px] font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 text-xs text-moss-dark bg-moss/10 border border-moss rounded-[10px] font-medium">
              {success}
            </div>
          )}

          {/* Details Card */}
          <div className="bg-sage-2 rounded-[16px] p-6 space-y-5 shadow-none border-none">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Logo preview / upload zone */}
              <div className="relative w-24 h-24 bg-white border border-line rounded-[14px] overflow-hidden flex items-center justify-center flex-shrink-0 group">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <span className="text-2xl text-forest-soft">🏢</span>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-sage/80 flex items-center justify-center">
                    <span className="w-4 h-4 border border-forest-soft border-t-moss rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <input
                  type="file"
                  id="logo-upload"
                  accept="image/*"
                  onChange={handleLogoChange}
                  disabled={uploading}
                  className="hidden"
                />
                <label
                  htmlFor="logo-upload"
                  className="px-4 py-1.5 text-xs font-semibold border border-forest hover:bg-sage-2 rounded-full text-forest cursor-pointer inline-block transition-colors"
                >
                  Upload Logo
                </label>
                <p className="text-[10px] text-forest-soft">Square images with transparent backgrounds look best.</p>
              </div>
            </div>

            <div>
              <label htmlFor="name" className="block text-xs font-bold text-forest-soft uppercase tracking-wider mb-1.5">
                Company Name
              </label>
              <input
                id="name"
                type="text"
                required
                disabled={isPending}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-line rounded-[10px] text-forest focus:outline-none focus:ring-1 focus:ring-moss text-sm"
                placeholder="Acme Corp"
              />
            </div>

            <div>
              <label htmlFor="website" className="block text-xs font-bold text-forest-soft uppercase tracking-wider mb-1.5">
                Website URL
              </label>
              <input
                id="website"
                type="text"
                disabled={isPending}
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-line rounded-[10px] text-forest focus:outline-none focus:ring-1 focus:ring-moss text-sm"
                placeholder="https://acme.com"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-xs font-bold text-forest-soft uppercase tracking-wider mb-1.5">
                Company Description
              </label>
              <textarea
                id="description"
                rows={4}
                disabled={isPending}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-line rounded-[10px] text-forest focus:outline-none focus:ring-1 focus:ring-moss text-sm resize-none"
                placeholder="Write a brief summary of what your company builds or stands for..."
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending || uploading}
            className="w-full py-3.5 bg-moss border border-moss hover:bg-moss-dark text-white rounded-full text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            {isPending ? "Saving changes..." : "Save Company Settings"}
          </button>
        </form>
      </div>
    </div>
  )
}
