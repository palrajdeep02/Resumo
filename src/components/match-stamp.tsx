import React from "react"
import { cn } from "@/lib/utils"

interface MatchStampProps {
  score?: number
  status?: string
  className?: string
  innerBgClass?: string // Allows customizing the cutout center bg (e.g., bg-sage vs bg-sage-2)
}

export default function MatchStamp({ score, status, className, innerBgClass }: MatchStampProps) {
  const isPercent = typeof score === "number"

  if (!isPercent) {
    // If it's a status, render a beautiful flat pill badge matching the user's status styling
    const s = String(status || "").toUpperCase()
    let colorClass = "bg-sand/20 text-forest border-line"

    if (s === "SHORTLISTED" || s === "HIRED") {
      colorClass = "bg-moss text-white border-moss"
    } else if (s === "REJECTED") {
      colorClass = "bg-coral text-white border-coral"
    } else if (s === "APPLIED") {
      colorClass = "bg-sage border-line text-forest"
    }

    return (
      <span
        className={cn(
          "inline-flex items-center justify-center px-3 py-1 text-xs font-semibold rounded-full border",
          colorClass,
          className
        )}
      >
        {status}
      </span>
    )
  }

  // If it's a match percentage score, render the conic-gradient progress ring
  const val = score ?? 0
  const progressColor = val >= 70 ? "var(--moss)" : "var(--coral)"
  const trackColor = "var(--sand)"
  
  // Conic gradient string
  const gradient = `conic-gradient(${progressColor} 0% ${val}%, ${trackColor} ${val}% 100%)`

  return (
    <div
      className={cn(
        "relative rounded-full flex items-center justify-center shrink-0 shadow-none",
        "w-16 h-16", // Default size
        className
      )}
      style={{ background: gradient }}
    >
      {/* Inner Cutout Circle */}
      <div
        className={cn(
          "absolute inset-[5px] rounded-full flex flex-col items-center justify-center",
          innerBgClass || "bg-sage-2"
        )}
      >
        <span className="font-serif text-sm sm:text-base font-bold text-forest leading-none">
          {val}%
        </span>
        <span className="text-[8px] text-forest-soft uppercase tracking-wider scale-90 mt-0.5 leading-none">
          match
        </span>
      </div>
    </div>
  )
}
