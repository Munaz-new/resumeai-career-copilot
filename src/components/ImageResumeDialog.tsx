import { useState } from "react";
import { FileWarning, ExternalLink, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ImageResumeDialogProps {
  open: boolean;
  fileName: string;
  qualityWarning?: string;
  onContinue: () => void;
  onCancel: () => void;
}

const CONVERTERS = [
  { name: "iLovePDF", url: "https://www.ilovepdf.com/jpg_to_pdf" },
  { name: "Smallpdf", url: "https://smallpdf.com/jpg-to-pdf" },
  { name: "Adobe JPG to PDF", url: "https://www.adobe.com/acrobat/online/jpg-to-pdf.html" },
];

export function ImageResumeDialog({
  open,
  fileName,
  qualityWarning,
  onContinue,
  onCancel,
}: ImageResumeDialogProps) {
  const [showConverters, setShowConverters] = useState(false);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setShowConverters(false);
      onCancel();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileWarning className="w-5 h-5 text-warning" />
            Image Resume Detected
          </DialogTitle>
          <DialogDescription className="space-y-2 pt-1">
            <span className="block">
              For best ATS accuracy, <strong>PDF or DOCX</strong> is recommended — ATS systems read
              text more reliably than images.
            </span>
            <span className="block">Image resumes may reduce accuracy.</span>
            {qualityWarning && (
              <span className="block rounded-lg bg-warning/10 text-warning px-3 py-2 text-sm">
                {qualityWarning}
              </span>
            )}
            {fileName && (
              <span className="block text-xs text-muted-foreground truncate">File: {fileName}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        {showConverters && (
          <div className="rounded-xl border border-border bg-muted/40 p-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">
              Optional — convert your image with a trusted tool, then upload the PDF:
            </p>
            <div className="flex flex-col gap-1.5">
              {CONVERTERS.map((c) => (
                <a
                  key={c.name}
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-primary hover:bg-primary/10 transition-colors"
                >
                  {c.name}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="ghost" onClick={onCancel} className="sm:mr-auto">
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowConverters((s) => !s)}
          >
            Convert to PDF
          </Button>
          <Button onClick={onContinue}>
            Continue Anyway
            <ArrowRight className="w-4 h-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
