import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSalaryLPA(min: number | null | undefined, max: number | null | undefined): string {
  if (!min && !max) return "Competitive"
  
  const getLakhsVal = (val: number) => {
    if (val >= 100000) {
      const lakhs = val / 100000
      return Number.isInteger(lakhs) ? `${lakhs}L` : `${lakhs.toFixed(1).replace(".0", "")}L`
    } else if (val >= 10000) {
      // e.g. 80000 -> 8L
      const lakhs = val / 10000
      return Number.isInteger(lakhs) ? `${lakhs}L` : `${lakhs.toFixed(1).replace(".0", "")}L`
    } else if (val >= 1000) {
      return `${Math.round(val / 1000)}k`
    }
    // E.g. val is 8 or 12
    return `${val}L`
  }

  const minStr = min ? `₹${getLakhsVal(min)}` : ""
  const maxStr = max ? `₹${getLakhsVal(max)}` : ""
  return minStr && maxStr ? `${minStr}–${maxStr} LPA` : (minStr ? `${minStr} LPA` : `${maxStr} LPA`)
}
