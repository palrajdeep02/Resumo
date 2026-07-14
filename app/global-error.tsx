"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global system crash:", error);
  }, [error]);

  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex items-center justify-center bg-[#FAF9F6] p-6 font-sans text-[#0D121F]">
        <div className="border border-[#E5E8EB] bg-white p-8 max-w-md w-full text-center shadow-sm">
          <span className="font-mono text-xs text-[#D23B38] uppercase tracking-widest block mb-2">
            // Global System Error
          </span>
          <h1 className="font-serif text-3xl font-medium mb-3">Critical Failure</h1>
          <p className="text-sm text-[#5A6275] mb-6 leading-relaxed">
            A critical system-level rendering error occurred. The application root has crashed.
          </p>
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center bg-[#D23B38] hover:bg-[#D23B38]/90 text-white font-medium px-6 py-2.5 rounded-none text-xs font-mono uppercase tracking-wider h-10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D23B38]"
          >
            Retry Application
          </button>
        </div>
      </body>
    </html>
  );
}
