"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getCandidateProfile, updateCandidateProfile, parseResumeAction } from "@/server/candidate-actions"
import { toast } from "sonner"

interface EducationEntry {
  degree: string
  institution: string
  year: number
}

export default function CandidateProfilePage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)

  // Form states
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const [experienceYears, setExperienceYears] = useState<number>(0)
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState("")
  const [education, setEducation] = useState<EducationEntry[]>([])
  const [resumeUrl, setResumeUrl] = useState("")

  // UI state
  const [uploading, setUploading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Load profile
  useEffect(() => {
    async function load() {
      const res = await getCandidateProfile()
      if (res.error) {
        setError(res.error)
      } else if (res.profile) {
        const p = res.profile
        setName(p.user?.name || "")
        setBio(p.bio || "")
        setExperienceYears(p.experienceYears || 0)
        setSkills(p.parsedSkills || [])
        setEducation((p.education as unknown as EducationEntry[]) || [])
        setResumeUrl(p.resumeUrl || "")
      }
      setLoading(false)
    }
    load()
  }, [])

  // File upload handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setResumeUrl(data.url)
        toast.success("Resume uploaded successfully! Click 'Parse Resume with AI' to extract information.")
      } else {
        toast.error(data.error || "Failed to upload resume")
      }
    } catch (err) {
      console.error(err)
      toast.error("File upload failed")
    } finally {
      setUploading(false)
    }
  }

  // Parse Resume handler
  const handleParseResume = async () => {
    if (!resumeUrl) return
    setParsing(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await parseResumeAction(resumeUrl)
      if (res.error) {
        toast.error(res.error)
      } else if (res.data) {
        const d = res.data
        setSkills(d.parsedSkills)
        setExperienceYears(d.experienceYears)
        setBio(d.bio)
        setEducation(d.education)
        toast.success("Resume parsed successfully! Please review and save your profile.")
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to parse resume")
    } finally {
      setParsing(false)
    }
  }

  // Add skill tag
  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newSkill.trim()
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed])
      setNewSkill("")
    }
  }

  // Remove skill tag
  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill))
  }

  // Education controls
  const handleAddEducation = () => {
    setEducation([...education, { degree: "", institution: "", year: new Date().getFullYear() }])
  }

  const handleRemoveEducation = (index: number) => {
    setEducation(education.filter((_, i) => i !== index))
  }

  const handleEducationChange = (index: number, key: keyof EducationEntry, val: string | number) => {
    const updated = [...education]
    updated[index] = {
      ...updated[index],
      [key]: val,
    }
    setEducation(updated)
  }

  // Save form
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!name.trim()) {
      toast.error("Full name is required")
      return
    }

    startTransition(async () => {
      const res = await updateCandidateProfile({
        name,
        bio,
        experienceYears,
        parsedSkills: skills,
        education,
        resumeUrl,
      })

      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("Profile saved successfully!")
        router.refresh()
      }
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sage text-forest-soft">
        <div className="flex items-center space-x-2">
          <span className="w-6 h-6 border-2 border-forest-soft border-t-moss rounded-full animate-spin" />
          <span>Loading Profile...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-sage py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-end pb-4 border-b border-line">
          <div>
            <h1 className="text-3xl font-serif font-medium text-forest">
              Edit Candidate Profile
            </h1>
            <p className="text-sm text-forest-soft mt-1">
              Complete your profile or parse details from your resume
            </p>
          </div>
          <Link
            href="/dashboard/candidate"
            className="px-5 py-2 text-xs font-semibold border border-forest hover:bg-sage-2 text-forest rounded-full transition-colors"
          >
            Dashboard
          </Link>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {error && (
            <div className="p-4 text-sm text-coral-dark bg-coral/10 border border-coral rounded-[10px] font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 text-sm text-moss-dark bg-moss/10 border border-moss rounded-[10px] font-medium">
              {success}
            </div>
          )}

          {/* Resume Upload Card */}
          <div className="bg-sage-2 rounded-[16px] p-6 space-y-4">
            <h2 className="text-base font-bold text-forest">1. Resume Upload</h2>
            <div className="border-2 border-dashed border-line hover:border-moss rounded-[14px] p-6 text-center transition-all bg-white relative">
              <input
                type="file"
                id="resume-upload"
                accept=".pdf,.docx"
                onChange={handleFileChange}
                disabled={uploading || parsing}
                className="hidden"
              />
              <label htmlFor="resume-upload" className="cursor-pointer block space-y-2">
                <div className="mx-auto w-12 h-12 flex items-center justify-center bg-sage-2 rounded-full text-forest-soft text-xl">
                  📄
                </div>
                <div className="text-sm text-forest">
                  <span className="font-semibold text-moss hover:text-moss-dark">
                    Click to upload
                  </span>{" "}
                  or drag and drop
                </div>
                <p className="text-xs text-forest-soft">PDF or DOCX (Max 5MB)</p>
              </label>

              {uploading && (
                <div className="absolute inset-0 bg-sage/80 rounded-[14px] flex items-center justify-center space-x-2">
                  <span className="w-5 h-5 border-2 border-forest-soft border-t-moss rounded-full animate-spin" />
                  <span className="text-sm text-forest-soft">Uploading File...</span>
                </div>
              )}
            </div>

            {resumeUrl && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3.5 bg-white border border-line rounded-[10px] gap-3">
                <div className="flex items-center space-x-2.5 truncate">
                  <span className="text-moss font-bold">✓</span>
                  <a
                    href={resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-forest hover:text-moss underline truncate font-medium"
                  >
                    View uploaded resume ({resumeUrl.split("/").pop()})
                  </a>
                </div>
                <button
                  type="button"
                  onClick={handleParseResume}
                  disabled={parsing || uploading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-moss border border-moss hover:bg-moss-dark rounded-full transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {parsing ? (
                    <div className="flex items-center space-x-2">
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Parsing with AI...</span>
                    </div>
                  ) : (
                    "Parse Resume with AI"
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Profile Details Card */}
          <div className="bg-sage-2 rounded-[16px] p-6 space-y-4">
            <h2 className="text-base font-bold text-forest">2. Professional Details</h2>

            <div>
              <label htmlFor="name" className="block text-xs font-bold text-forest-soft uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                required
                disabled={isPending}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-line rounded-[10px] text-forest focus:outline-none focus:ring-1 focus:ring-moss text-sm"
                placeholder="Priya Sharma"
              />
            </div>

            <div>
              <label htmlFor="bio" className="block text-xs font-bold text-forest-soft uppercase tracking-wider mb-1.5">
                Professional Summary / Bio
              </label>
              <textarea
                id="bio"
                rows={4}
                disabled={isPending}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-line rounded-[10px] text-forest focus:outline-none focus:ring-1 focus:ring-moss text-sm resize-none"
                placeholder="Write a brief overview of your skills and career highlights..."
              />
            </div>

            <div>
              <label htmlFor="experience" className="block text-xs font-bold text-forest-soft uppercase tracking-wider mb-1.5">
                Years of Experience
              </label>
              <input
                id="experience"
                type="number"
                min={0}
                disabled={isPending}
                value={experienceYears}
                onChange={(e) => setExperienceYears(parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 bg-white border border-line rounded-[10px] text-forest focus:outline-none focus:ring-1 focus:ring-moss text-sm"
              />
            </div>
          </div>

          {/* Skills Card */}
          <div className="bg-sage-2 rounded-[16px] p-6 space-y-4">
            <h2 className="text-base font-bold text-forest">3. Skills (Tags)</h2>
            <div className="space-y-3">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newSkill}
                  disabled={isPending}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault()
                      handleAddSkill(e)
                    }
                  }}
                  className="flex-grow px-3.5 py-2.5 bg-white border border-line rounded-[10px] text-forest focus:outline-none focus:ring-1 focus:ring-moss text-sm"
                  placeholder="Type a skill and press Enter or comma..."
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-5 py-2.5 bg-white hover:bg-sage-2 text-forest border border-line rounded-[10px] text-xs font-semibold transition-colors cursor-pointer"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {skills.length === 0 ? (
                  <span className="text-xs text-forest-soft font-medium">No skills added yet.</span>
                ) : (
                  skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white border border-line text-forest-soft"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="ml-1.5 text-coral-dark hover:text-coral text-xs font-black focus:outline-none cursor-pointer"
                      >
                        ✕
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Education Card */}
          <div className="bg-sage-2 rounded-[16px] p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-forest">4. Education</h2>
              <button
                type="button"
                onClick={handleAddEducation}
                className="px-4 py-1.5 text-xs font-semibold border border-moss hover:bg-moss-dark bg-moss text-white rounded-full transition-all cursor-pointer"
              >
                + Add Education
              </button>
            </div>

            <div className="space-y-4">
              {education.length === 0 ? (
                <div className="text-center p-6 border border-line rounded-[14px] bg-white">
                  <p className="text-xs text-forest-soft font-semibold">No education entries added yet.</p>
                </div>
              ) : (
                education.map((entry, index) => (
                  <div
                    key={index}
                    className="p-4 bg-white border border-line rounded-[14px] space-y-3 relative group"
                  >
                    <button
                      type="button"
                      onClick={() => handleRemoveEducation(index)}
                      className="absolute top-3 right-3 text-coral-dark hover:text-coral hover:underline text-xs font-semibold cursor-pointer"
                      title="Remove Entry"
                    >
                      ✕ Remove
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block text-[10px] font-bold text-forest-soft uppercase tracking-wider mb-1">
                          Degree / Course
                        </label>
                        <input
                          type="text"
                          required
                          value={entry.degree}
                          onChange={(e) => handleEducationChange(index, "degree", e.target.value)}
                          className="w-full px-3 py-2 bg-sage border border-line rounded-[10px] text-forest focus:outline-none focus:ring-1 focus:ring-moss text-xs"
                          placeholder="B.S. Computer Science"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-forest-soft uppercase tracking-wider mb-1">
                          Institution
                        </label>
                        <input
                          type="text"
                          required
                          value={entry.institution}
                          onChange={(e) => handleEducationChange(index, "institution", e.target.value)}
                          className="w-full px-3 py-2 bg-sage border border-line rounded-[10px] text-forest focus:outline-none focus:ring-1 focus:ring-moss text-xs"
                          placeholder="Stanford University"
                        />
                      </div>
                    </div>

                    <div className="w-1/3">
                      <label className="block text-[10px] font-bold text-forest-soft uppercase tracking-wider mb-1">Year</label>
                      <input
                        type="number"
                        required
                        value={entry.year}
                        onChange={(e) => handleEducationChange(index, "year", parseInt(e.target.value) || new Date().getFullYear())}
                        className="w-full px-3 py-2 bg-sage border border-line rounded-[10px] text-forest focus:outline-none focus:ring-1 focus:ring-moss text-xs"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3.5 bg-moss border border-moss hover:bg-moss-dark text-white rounded-full text-sm font-semibold transition-colors cursor-pointer"
          >
            {isPending ? "Saving Profile..." : "Save Profile"}
          </button>
        </form>
      </div>
    </div>
  )
}
