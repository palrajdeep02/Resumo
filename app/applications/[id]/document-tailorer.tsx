"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateDocumentContent } from "@/app/actions/applications";
import { useRouter } from "next/navigation";

interface TailoredDoc {
  id: string;
  applicationId: string;
  type: "resume" | "cover_letter";
  contentMd: string;
  version: number;
  createdAt: Date;
}

interface DocumentTailorerProps {
  applicationId: string;
  docs: TailoredDoc[];
}

export default function DocumentTailorer({ applicationId, docs }: DocumentTailorerProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<"resume" | "cover_letter">("resume");
  const [editorContent, setEditorContent] = React.useState("");
  const [selectedDocId, setSelectedDocId] = React.useState<string | null>(null);
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [message, setMessage] = React.useState("");

  // Filter documents based on active tab
  const filteredDocs = React.useMemo(() => {
    return docs
      .filter((d) => d.type === activeTab)
      .sort((a, b) => b.version - a.version); // newest first
  }, [docs, activeTab]);

  // Load the latest document on mount or tab change
  React.useEffect(() => {
    if (filteredDocs.length > 0) {
      const latest = filteredDocs[0];
      setSelectedDocId(latest.id);
      setEditorContent(latest.contentMd);
    } else {
      setSelectedDocId(null);
      setEditorContent("");
    }
  }, [activeTab, filteredDocs]);

  // Handle dropdown selection change
  const handleVersionChange = (value: string | null) => {
    if (!value) return;
    const doc = filteredDocs.find((d) => d.id === value);
    if (doc) {
      setSelectedDocId(doc.id);
      setEditorContent(doc.contentMd);
    }
  };

  // Handle AI generation stream
  const handleGenerate = async () => {
    setIsStreaming(true);
    setEditorContent("");
    setSelectedDocId(null);
    setMessage("");

    try {
      const res = await fetch("/api/ai/tailor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ applicationId, type: activeTab }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setMessage(errorData.error || "Generation failed.");
        setIsStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        setMessage("Could not establish text stream reader.");
        setIsStreaming(false);
        return;
      }

      let accumulatedText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulatedText += chunk;
        setEditorContent(accumulatedText);
      }

      setMessage("Tailored document generated and saved.");
      setTimeout(() => setMessage(""), 3000);
      
      // Refresh page to load the new version from the DB
      router.refresh();
    } catch (err) {
      console.error(err);
      setMessage("An unexpected error occurred during stream generation.");
    } finally {
      setIsStreaming(false);
    }
  };

  // Handle saving manual edits
  const handleSaveEdits = async () => {
    if (!selectedDocId) return;
    setIsStreaming(true);
    setMessage("");

    try {
      const res = await updateDocumentContent(selectedDocId, editorContent);
      if (res.success) {
        setMessage(res.message || "Changes saved.");
        setTimeout(() => setMessage(""), 2000);
        router.refresh();
      } else {
        setMessage(res.message || "Failed to save edits.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Network error saving edits.");
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="border border-grid bg-white p-6 shadow-sm space-y-6">
      {/* Tab Switcher */}
      <div className="flex border-b border-grid">
        <button
          onClick={() => setActiveTab("resume")}
          disabled={isStreaming}
          className={`flex-1 pb-3 text-xs uppercase font-mono tracking-wider font-semibold transition-colors border-b-2 ${
            activeTab === "resume"
              ? "border-crimson text-crimson"
              : "border-transparent text-lead hover:text-ink disabled:opacity-50"
          }`}
        >
          // Tailor Resume
        </button>
        <button
          onClick={() => setActiveTab("cover_letter")}
          disabled={isStreaming}
          className={`flex-1 pb-3 text-xs uppercase font-mono tracking-wider font-semibold transition-colors border-b-2 ${
            activeTab === "cover_letter"
              ? "border-crimson text-crimson"
              : "border-transparent text-lead hover:text-ink disabled:opacity-50"
          }`}
        >
          // Draft Cover Letter
        </button>
      </div>

      {/* Editor Controls */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        {/* Version Dropdown */}
        {filteredDocs.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-lead uppercase">// Version:</span>
            <Select value={selectedDocId || undefined} onValueChange={handleVersionChange} disabled={isStreaming}>
              <SelectTrigger className="border-grid rounded-none text-xs font-mono h-8 min-w-[120px] bg-transparent focus:ring-0">
                <SelectValue placeholder="Select version" />
              </SelectTrigger>
              <SelectContent className="rounded-none bg-white border border-grid shadow-sm z-50">
                {filteredDocs.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id} className="text-xs font-mono rounded-none">
                    v{doc.version} ({new Date(doc.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={handleGenerate}
          disabled={isStreaming}
          className="bg-crimson hover:bg-crimson/90 text-white font-medium px-4 py-1.5 rounded-none text-xs uppercase tracking-wider font-mono h-8 transition-colors ml-auto"
        >
          {isStreaming ? "Streaming..." : filteredDocs.length > 0 ? "Regenerate" : "Generate Draft"}
        </Button>
      </div>

      {/* Editor Area */}
      <div className="space-y-2">
        <label htmlFor="editor" className="sr-only">
          Document Editor Content
        </label>
        <Textarea
          id="editor"
          value={editorContent}
          onChange={(e) => setEditorContent(e.target.value)}
          disabled={isStreaming}
          rows={18}
          placeholder={
            isStreaming
              ? "AI is streaming tailored draft. Please wait..."
              : activeTab === "resume"
              ? "No tailored resume generated yet. Click 'Generate Draft' above to stream resume experience bullets optimized for this job description..."
              : "No cover letter generated yet. Click 'Generate Draft' above to draft a tailored cover letter..."
          }
          className="border-grid focus-visible:ring-crimson rounded-none font-mono text-xs resize-y min-h-[350px] leading-relaxed bg-parchment/20"
        />
      </div>

      {/* Footer controls & message */}
      <div className="flex justify-between items-center border-t border-grid pt-4">
        <span className="text-[10px] font-mono text-crimson italic">
          {message}
        </span>
        {selectedDocId && (
          <Button
            onClick={handleSaveEdits}
            disabled={isStreaming}
            className="bg-ink hover:bg-ink/90 text-white font-medium px-5 py-1.5 rounded-none text-xs uppercase tracking-wider font-mono h-8 transition-colors"
          >
            Save Changes
          </Button>
        )}
      </div>
    </div>
  );
}
