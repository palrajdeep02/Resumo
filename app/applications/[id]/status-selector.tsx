"use client";

import * as React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateApplicationStatus } from "@/app/actions/applications";
import { useRouter } from "next/navigation";

interface StatusSelectorProps {
  applicationId: string;
  initialStatus: "saved" | "applied" | "interviewing" | "offer" | "rejected";
}

export default function StatusSelector({ applicationId, initialStatus }: StatusSelectorProps) {
  const router = useRouter();
  const [status, setStatus] = React.useState(initialStatus);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [message, setMessage] = React.useState("");

  const handleStatusChange = async (value: "saved" | "applied" | "interviewing" | "offer" | "rejected" | null) => {
    if (!value) return;
    setIsUpdating(true);
    setMessage("");

    try {
      const res = await updateApplicationStatus(applicationId, value);
      if (res.success) {
        setStatus(value);
        setMessage("Status updated.");
        setTimeout(() => setMessage(""), 2000);
        router.refresh();
      } else {
        setMessage(res.message || "Failed to update.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Failed to update status.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs uppercase tracking-wider text-lead">
          // Status Stage:
        </span>
        <Select value={status} onValueChange={handleStatusChange} disabled={isUpdating}>
          <SelectTrigger className="border-grid rounded-none text-xs font-mono uppercase bg-white py-1 h-8 min-w-[150px] focus:ring-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-none bg-white border border-grid shadow-sm z-50">
            <SelectItem value="saved" className="text-xs font-mono uppercase rounded-none">Saved</SelectItem>
            <SelectItem value="applied" className="text-xs font-mono uppercase rounded-none">Applied</SelectItem>
            <SelectItem value="interviewing" className="text-xs font-mono uppercase rounded-none">Interviewing</SelectItem>
            <SelectItem value="offer" className="text-xs font-mono uppercase rounded-none">Offer</SelectItem>
            <SelectItem value="rejected" className="text-xs font-mono uppercase rounded-none">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {message && (
        <span className="text-[10px] font-mono text-crimson italic">
          {message}
        </span>
      )}
    </div>
  );
}
