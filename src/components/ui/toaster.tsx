"use client"

import { Toaster as SonnerToaster } from "sonner"

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        className: "bg-slate-900 border border-slate-850 text-slate-100 rounded-xl font-sans text-xs p-3 shadow-2xl",
      }}
    />
  )
}
