import * as pdfjsLib from "pdfjs-dist";
// Vite bundles the worker locally — no CDN dependency.
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import mammoth from "mammoth";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export type AtsConfidence = "high" | "medium" | "low";
export type FileKind = "pdf" | "docx" | "image" | "unknown";

export interface ParseResult {
  text: string;
  success: boolean;
  error?: string;
  preview: string;
  confidence?: AtsConfidence;
  fileKind?: FileKind;
  requiresConfirmation?: boolean;
}

const IMAGE_EXTS = [".png", ".jpg", ".jpeg"];

export function detectFileKind(file: File): FileKind {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx")
  ) {
    return "docx";
  }
  if (file.type.startsWith("image/") || IMAGE_EXTS.some((e) => name.endsWith(e))) {
    return "image";
  }
  return "unknown";
}

/**
 * Future OCR seam. Drop a Tesseract.js engine in `runOcr` later — no caller
 * changes needed. Today OCR is not implemented, so we return a clear,
 * low-confidence result that nudges the user to paste text or convert.
 */
async function runOcr(_file: File): Promise<{ text: string; confidence: AtsConfidence } | null> {
  // Intentionally not implemented yet. Returning null signals "no OCR engine".
  return null;
}

export async function parseImageResume(file: File): Promise<ParseResult> {
  const ocr = await runOcr(file);
  if (ocr && ocr.text.replace(/\s+/g, " ").trim().length >= 50) {
    const text = cleanResumeText(ocr.text);
    return {
      text,
      success: true,
      preview: text.replace(/\s+/g, " ").trim().slice(0, 500),
      confidence: ocr.confidence,
      fileKind: "image",
      requiresConfirmation: true,
    };
  }
  return {
    text: "",
    success: false,
    error:
      "Image text extraction isn't available yet. For accurate ATS analysis, upload a PDF or DOCX, or switch to the Paste Text tab and paste your resume.",
    preview: "",
    confidence: "low",
    fileKind: "image",
    requiresConfirmation: true,
  };
}

/**
 * Normalize extracted resume text without destroying structure.
 * - fix hyphenated line-breaks: "foo-\nbar" -> "foobar"
 * - normalize smart quotes / dashes
 * - collapse runs of spaces/tabs (but keep newlines)
 * - dedupe blank lines (max 1 in a row)
 * - preserve bullet characters
 */
export function cleanResumeText(raw: string): string {
  if (!raw) return "";
  let t = raw
    .replace(/\r\n?/g, "\n")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u00a0/g, " ")
    // join hyphenated line-breaks
    .replace(/(\w)-\n(\w)/g, "$1$2")
    // collapse horizontal whitespace
    .replace(/[ \t]+/g, " ")
    // trim each line
    .split("\n").map((l) => l.trim()).join("\n")
    // collapse 3+ newlines into 2
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return t;
}

export async function parsePDF(file: File): Promise<ParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      // Reconstruct lines using y-coordinate from text transform.
      // pdf.js items have transform: [a, b, c, d, e, f] where f = y.
      const items = (content.items as any[])
        .filter((it) => "str" in it && it.str)
        .map((it) => ({
          str: it.str as string,
          x: it.transform?.[4] ?? 0,
          y: it.transform?.[5] ?? 0,
          hasEOL: !!it.hasEOL,
        }));
      // Group items by y (rounded to nearest 2 pts) then sort each row by x.
      const rows = new Map<number, { x: number; str: string }[]>();
      for (const it of items) {
        const key = Math.round(it.y / 2) * 2;
        if (!rows.has(key)) rows.set(key, []);
        rows.get(key)!.push({ x: it.x, str: it.str });
      }
      const orderedYs = [...rows.keys()].sort((a, b) => b - a); // top-to-bottom (PDF y grows upward)
      const lines: string[] = [];
      for (const yKey of orderedYs) {
        const row = rows.get(yKey)!.sort((a, b) => a.x - b.x);
        let line = "";
        let prevX: number | null = null;
        for (const seg of row) {
          if (prevX !== null && seg.x - prevX > 8 && !line.endsWith(" ")) line += " ";
          line += seg.str;
          prevX = seg.x + seg.str.length * 4;
        }
        const trimmed = line.replace(/\s+/g, " ").trim();
        if (trimmed) lines.push(trimmed);
      }
      pages.push(lines.join("\n"));
    }

    const fullText = cleanResumeText(pages.join("\n\n"));
    const cleaned = fullText.replace(/\s+/g, " ").trim();

    if (cleaned.length < 50) {
      return {
        text: "",
        success: false,
        error: "Unable to properly extract resume text.",
        preview: cleaned.slice(0, 500),
      };
    }

    return {
      text: fullText,
      success: true,
      preview: cleaned.slice(0, 500),
    };
  } catch (err: any) {
    if (import.meta.env.DEV) console.error("PDF parsing error:", err);
    return {
      text: "",
      success: false,
      error: "We couldn't read this PDF. Try another PDF or export again.",
      preview: "",
    };
  }
}

export async function parseDOCX(file: File): Promise<ParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    let text = "";
    try {
      const html = await mammoth.convertToHtml({ arrayBuffer });
      text = htmlToStructuredText(html.value);
    } catch {
      const raw = await mammoth.extractRawText({ arrayBuffer });
      text = raw.value;
    }
    text = cleanResumeText(text);
    const cleaned = text.replace(/\s+/g, " ").trim();

    if (cleaned.length < 50) {
      return {
        text: "",
        success: false,
        error: "Unable to properly extract resume text.",
        preview: cleaned.slice(0, 500),
      };
    }

    return {
      text,
      success: true,
      preview: cleaned.slice(0, 500),
    };
  } catch (err: any) {
    return {
      text: "",
      success: false,
      error: `DOCX parsing failed: ${err.message || "Unknown error"}`,
      preview: "",
    };
  }
}

function htmlToStructuredText(html: string): string {
  // Lightweight HTML -> text that preserves headings, list bullets and paragraphs.
  let h = html
    .replace(/<\/(p|div|h[1-6])>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  return h;
}

export async function parseResumeFile(file: File): Promise<ParseResult> {
  const kind = detectFileKind(file);
  if (kind === "pdf") {
    const res = await parsePDF(file);
    return { ...res, fileKind: "pdf", confidence: res.confidence ?? (res.success ? "high" : "low") };
  }
  if (kind === "docx") {
    const res = await parseDOCX(file);
    return { ...res, fileKind: "docx", confidence: res.confidence ?? (res.success ? "high" : "low") };
  }
  if (kind === "image") {
    return parseImageResume(file);
  }
  return {
    text: "",
    success: false,
    error: "Unsupported file format. Please upload a PDF, DOCX, PNG, or JPG file.",
    preview: "",
    fileKind: "unknown",
  };
}
