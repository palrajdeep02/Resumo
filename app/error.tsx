"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application runtime error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-parchment flex flex-col justify-center items-center px-4 font-sans text-ink">
      <div className="border border-grid bg-white p-8 max-w-md w-full text-center shadow-sm">
        <span className="font-mono text-xs text-crimson uppercase tracking-widest block mb-2">
          // System Mismatch Error
        </span>
        <h1 className="font-serif text-3xl font-medium mb-3">Something Went Wrong</h1>
        <p className="text-sm text-lead mb-6 leading-relaxed">
          An unexpected error occurred while loading this section. This has been logged for diagnosis.
        </p>
        <div className="flex gap-4 justify-center">
          <Button
            onClick={() => window.location.href = "/dashboard"}
            className="bg-ink hover:bg-ink/90 text-white font-medium px-4 py-2 rounded-none text-xs uppercase tracking-wider font-mono h-8"
          >
            Dashboard
          </Button>
          <Button
            onClick={() => reset()}
            className="bg-crimson hover:bg-crimson/90 text-white font-medium px-4 py-2 rounded-none text-xs uppercase tracking-wider font-mono h-8"
          >
            Retry Section
          </Button>
        </div>
      </div>
    </div>
  );
}
