import { Upload, Loader2, FileCheck2 } from "lucide-react";
import type { AtsConfidence } from "@/lib/fileParser";

interface UploadCardProps {
  onFile: (file: File) => void;
  parsing?: boolean;
  fileName?: string;
  extractedChars?: number;
  atsConfidence?: AtsConfidence | null;
  accept?: string;
  compact?: boolean;
}

export function UploadCard({
  onFile,
  parsing = false,
  fileName,
  extractedChars,
  atsConfidence,
  accept = ".pdf,.docx,.png,.jpg,.jpeg",
  compact = false,
}: UploadCardProps) {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  };

  return (
    <div>
      <div
        className="upload-zone min-h-[220px]"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {parsing ? (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
            <p className="text-foreground font-semibold mt-3 text-sm">Extracting text…</p>
            <p className="text-xs text-muted-foreground mt-0.5">Parsing {fileName}</p>
          </div>
        ) : fileName ? (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto">
              <FileCheck2 className="w-6 h-6 text-success" />
            </div>
            <p className="text-foreground font-semibold mt-3 text-sm">{fileName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {extractedChars ? `Extracted ${extractedChars} characters` : "File ready for analysis"}
            </p>
            <label className="cursor-pointer inline-block mt-3">
              <span className="text-xs text-primary font-medium hover:underline">Replace file</span>
              <input
                type="file"
                accept={accept}
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
              />
            </label>
          </div>
        ) : (
          <div className="text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <p className="text-foreground font-semibold mt-3 text-sm">Drop your resume here</p>
            <label className="cursor-pointer mt-1">
              <span className="text-xs text-primary font-medium hover:underline">or browse files</span>
              <input
                type="file"
                accept={accept}
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
              />
            </label>

            {!compact && (
              <div className="mt-5 w-full max-w-xs space-y-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wide font-bold text-foreground/80">
                    Best ATS Accuracy <span className="text-warning">★</span>
                  </p>
                  <p className="text-sm font-semibold text-primary mt-0.5">PDF • DOCX</p>
                </div>
                <div className="pt-2 border-t border-border/60">
                  <p className="text-[10px] uppercase tracking-wide font-medium text-muted-foreground">
                    Also Supported
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    PNG • JPG <span className="text-xs">(Max 5MB)</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">
                    PNG/JPG is convenience support only
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {atsConfidence && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className="font-semibold text-muted-foreground">ATS Confidence:</span>
          {atsConfidence === "high" && <span className="text-success font-medium">High ✅</span>}
          {atsConfidence === "medium" && <span className="text-warning font-medium">Medium ⚠️</span>}
          {atsConfidence === "low" && <span className="text-destructive font-medium">Low ❌</span>}
        </div>
      )}
    </div>
  );
}
