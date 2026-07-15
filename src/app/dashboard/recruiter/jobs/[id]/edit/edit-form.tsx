"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { updateJob } from "@/server/recruiter-actions"
import { generateJobDescriptionAction } from "@/server/jd-actions"
import { toast } from "sonner"

interface JobData {
  id: string
  title: string
  description: string
  location: string | null
  employmentType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP"
  salaryMin: number | null
  salaryMax: number | null
  skillsRequired: string[]
  status: "DRAFT" | "PUBLISHED" | "CLOSED"
}

export default function EditJobForm({ job }: { job: JobData }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Form states
  const [title, setTitle] = useState(job.title)
  const [description, setDescription] = useState(job.description)
  const [location, setLocation] = useState(job.location || "")
  const [employmentType, setEmploymentType] = useState(job.employmentType)
  const [salaryMin, setSalaryMin] = useState<number>(job.salaryMin || 0)
  const [salaryMax, setSalaryMax] = useState<number>(job.salaryMax || 0)
  const [status, setStatus] = useState(job.status)

  // Skills tag input state
  const [skillsRequired, setSkillsRequired] = useState<string[]>(job.skillsRequired)
  const [newSkill, setNewSkill] = useState("")

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // AI JD Writer states
  const [roughInput, setRoughInput] = useState("")
  const [isAiPending, setIsAiPending] = useState(false)
  const [biasNotes, setBiasNotes] = useState<string[]>([])

  const handleAiImprove = async () => {
    setError(null)
    setSuccess(null)
    if (!title.trim()) {
      toast.error("Please fill in the Job Title first so the AI knows what role to write.")
      return
    }
    if (!roughInput.trim()) {
      toast.error("Please fill in the Rough Requirements to help the AI draft details.")
      return
    }

    setIsAiPending(true)
    try {
      const res = await generateJobDescriptionAction(title, roughInput)
      if (res.error) {
        toast.error(res.error)
      } else if (res.data) {
        setDescription(res.data.improvedDescription)
        setBiasNotes(res.data.biasCheckNotes || [])
        // Append suggested skills
        const newSkills = [...skillsRequired]
        ;(res.data.suggestedSkills || []).forEach((s) => {
          const trimmed = s.trim()
          if (trimmed && !newSkills.includes(trimmed)) {
            newSkills.push(trimmed)
          }
        })
        setSkillsRequired(newSkills)
        toast.success("AI successfully drafted description and suggested skills!")
      }
    } catch (err: any) {
      toast.error("Failed to improve description with AI")
    } finally {
      setIsAiPending(false)
    }
  }

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newSkill.trim()
    if (trimmed && !skillsRequired.includes(trimmed)) {
      setSkillsRequired([...skillsRequired, trimmed])
      setNewSkill("")
    }
  }

  const handleRemoveSkill = (skill: string) => {
    setSkillsRequired(skillsRequired.filter((s) => s !== skill))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!title.trim() || !description.trim() || !location.trim()) {
      toast.error("Please fill in job title, description, and location")
      return
    }

    if (skillsRequired.length === 0) {
      toast.error("Please add at least one required skill")
      return
    }

    startTransition(async () => {
      const res = await updateJob(job.id, {
        title,
        description,
        skillsRequired,
        location,
        employmentType,
        salaryMin: salaryMin > 0 ? salaryMin : undefined,
        salaryMax: salaryMax > 0 ? salaryMax : undefined,
        status,
      })

      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("Job listing updated successfully!")
        setTimeout(() => {
          router.push("/dashboard/recruiter/jobs")
        }, 1500)
      }
    })
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
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

        {/* AI Assistant Section */}
        <div className="bg-sage-2 rounded-[16px] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-forest">✨ AI JD Writer Assistant</h2>
            <span className="px-2.5 py-0.5 text-[9px] font-bold text-moss-dark bg-moss/10 border border-moss rounded-full">OPTIONAL</span>
          </div>
          <p className="text-xs text-forest-soft">
            Enter rough bullet points of requirements or keywords, and let Resumo AI write a structured, bias-reduced description.
          </p>
          <div>
            <label htmlFor="roughInput" className="block text-xs font-bold text-forest-soft uppercase tracking-wider mb-1.5">
              Rough Draft / Bullets
            </label>
            <textarea
              id="roughInput"
              rows={3}
              value={roughInput}
              onChange={(e) => setRoughInput(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-line rounded-[10px] text-forest focus:outline-none focus:ring-1 focus:ring-moss text-xs resize-none"
              placeholder="e.g. need JavaScript dev. must know React. 3 years exp. rockstar. young energetic developer. native speakers preferred."
            />
          </div>
          <button
            type="button"
            disabled={isAiPending}
            onClick={handleAiImprove}
            className="px-5 py-2 bg-moss hover:bg-moss-dark text-white rounded-full text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            {isAiPending ? "Improving description with AI..." : "Improve with AI ✨"}
          </button>

          {biasNotes.length > 0 && (
            <div className="p-4 bg-amber/10 border border-amber rounded-[10px] space-y-1.5 text-xs text-amber-dark font-medium">
              <span className="font-bold block">✨ AI Inclusive Language & Bias Scan Notes:</span>
              <ul className="list-disc list-inside space-y-1">
                {biasNotes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Details Card */}
        <div className="bg-sage-2 rounded-[16px] p-6 space-y-4">
          <h2 className="text-base font-bold text-forest">Job Specifications</h2>

          <div>
            <label htmlFor="title" className="block text-xs font-bold text-forest-soft uppercase tracking-wider mb-1.5">
              Job Title
            </label>
            <input
              id="title"
              type="text"
              required
              disabled={isPending}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-line rounded-[10px] text-forest focus:outline-none focus:ring-1 focus:ring-moss text-sm"
              placeholder="Senior Full Stack Engineer"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-xs font-bold text-forest-soft uppercase tracking-wider mb-1.5">
              Job Description
            </label>
            <textarea
              id="description"
              rows={6}
              required
              disabled={isPending}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-line rounded-[10px] text-forest focus:outline-none focus:ring-1 focus:ring-moss text-sm resize-none"
              placeholder="Detail the roles, responsibilities, requirements, and stack details..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="location" className="block text-xs font-bold text-forest-soft uppercase tracking-wider mb-1.5">
                Location
              </label>
              <input
                id="location"
                type="text"
                required
                disabled={isPending}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-line rounded-[10px] text-forest focus:outline-none focus:ring-1 focus:ring-moss text-sm"
                placeholder="Remote / Bangalore, IN"
              />
            </div>

            <div>
              <label htmlFor="type" className="block text-xs font-bold text-forest-soft uppercase tracking-wider mb-1.5">
                Employment Type
              </label>
              <select
                id="type"
                disabled={isPending}
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-white border border-line rounded-[10px] text-forest focus:outline-none focus:ring-1 focus:ring-moss text-sm bg-no-repeat"
              >
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERNSHIP">Internship</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="salaryMin" className="block text-xs font-bold text-forest-soft uppercase tracking-wider mb-1.5">
                Salary Min (LPA)
              </label>
              <input
                id="salaryMin"
                type="number"
                disabled={isPending}
                value={salaryMin === 0 ? "" : salaryMin}
                onChange={(e) => setSalaryMin(parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 bg-white border border-line rounded-[10px] text-forest focus:outline-none focus:ring-1 focus:ring-moss text-sm"
                placeholder="e.g. 8"
              />
            </div>

            <div>
              <label htmlFor="salaryMax" className="block text-xs font-bold text-forest-soft uppercase tracking-wider mb-1.5">
                Salary Max (LPA)
              </label>
              <input
                id="salaryMax"
                type="number"
                disabled={isPending}
                value={salaryMax === 0 ? "" : salaryMax}
                onChange={(e) => setSalaryMax(parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 bg-white border border-line rounded-[10px] text-forest focus:outline-none focus:ring-1 focus:ring-moss text-sm"
                placeholder="e.g. 12"
              />
            </div>
          </div>
        </div>

        {/* Skills Required Card */}
        <div className="bg-sage-2 rounded-[16px] p-6 space-y-4">
          <h2 className="text-base font-bold text-forest">Required Skills</h2>
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
              {skillsRequired.map((skill) => (
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
              ))}
            </div>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-sage-2 rounded-[16px] p-6 space-y-4">
          <h2 className="text-base font-bold text-forest">Visibility Status</h2>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center space-x-2 text-sm text-forest-soft font-semibold cursor-pointer">
              <input
                type="radio"
                name="status"
                value="PUBLISHED"
                checked={status === "PUBLISHED"}
                onChange={() => setStatus("PUBLISHED")}
                className="w-4 h-4 accent-moss text-moss bg-white border-line"
              />
              <span>Published (Active Board)</span>
            </label>
            <label className="flex items-center space-x-2 text-sm text-forest-soft font-semibold cursor-pointer">
              <input
                type="radio"
                name="status"
                value="DRAFT"
                checked={status === "DRAFT"}
                onChange={() => setStatus("DRAFT")}
                className="w-4 h-4 accent-moss text-moss bg-white border-line"
              />
              <span>Draft (Private Listing)</span>
            </label>
            <label className="flex items-center space-x-2 text-sm text-forest-soft font-semibold cursor-pointer">
              <input
                type="radio"
                name="status"
                value="CLOSED"
                checked={status === "CLOSED"}
                onChange={() => setStatus("CLOSED")}
                className="w-4 h-4 accent-moss text-moss bg-white border-line"
              />
              <span>Closed (Hidden)</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3.5 bg-moss border border-moss hover:bg-moss-dark text-white rounded-full text-sm font-semibold transition-colors cursor-pointer"
        >
          {isPending ? "Saving changes..." : "Save Job Details"}
        </button>
      </form>
    </div>
  )
}
