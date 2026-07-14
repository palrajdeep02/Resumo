"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface MatchAnalyzerProps {
  applicationId: string;
  hasScore: boolean;
}

export default function MatchAnalyzer({ applicationId, hasScore }: MatchAnalyzerProps) {
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/ai/score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ applicationId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to analyze match quality.");
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("An unexpected network error occurred.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleAnalyze}
        disabled={isAnalyzing}
        className="bg-crimson hover:bg-crimson/90 text-white font-medium px-6 py-2 rounded-none text-xs uppercase tracking-wider font-mono h-8 transition-colors w-full md:w-auto"
      >
        {isAnalyzing ? "Analyzing..." : hasScore ? "Re-Analyze Match" : "Analyze Match"}
      </Button>
      {errorMessage && (
        <p className="text-[10px] text-crimson font-mono mt-1 max-w-xs italic leading-tight">
          * {errorMessage}
        </p>
      )}
    </div>
  );
}
