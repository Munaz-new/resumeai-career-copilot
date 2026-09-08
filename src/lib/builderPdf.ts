import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { ResumeDraft } from "./resumeDraft";
import { exportResumePdfSafe } from "./builderPdfFallback";

/**
 * WYSIWYG PDF export with automatic fallback.
 *
 * The resume preview is responsive. Exporting it at a forced 760px width can
 * change column widths, line wrapping, and therefore the vertical position of
 * text compared with what the user sees on screen. We capture at the preview's
 * actual rendered width instead, then scale that image onto the PDF page.
 *
 * We also inline computed styles in the clone so Tailwind v4 color functions
 * such as oklch do not cause html2canvas to abort and fall back to the old
 * text-only exporter.
 */
export type ExportMode = "wysiwyg" | "fallback";

const UNSUPPORTED_COLOR_RE = /(oklch|oklab|lab\(|lch\(|color\(|color-mix)/i;
const ONE_PAGE_TOLERANCE = 1.08;
const CAPTURE_SCALE = 3;

function safeCssValue(property: string, value: string): string | null {
  if (!value || UNSUPPORTED_COLOR_RE.test(value)) {
    if (property === "background-image" || property === "box-shadow" || property === "text-shadow") return "none";
    if (property === "color" || property === "caret-color" || property === "fill" || property === "stroke") return "#111827";
    if (property.includes("background-color")) return "#ffffff";
    if (property.includes("border") && property.endsWith("-color")) return "#e5e7eb";
    return value && UNSUPPORTED_COLOR_RE.test(value) ? null : value;
  }
  return value;
}

function inlineComputedStyles(doc: Document, root: HTMLElement) {
  const nodes: HTMLElement[] = [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))];

  for (const el of nodes) {
    const cs = doc.defaultView?.getComputedStyle(el);
    if (!cs) continue;

    for (let i = 0; i < cs.length; i += 1) {
      const property = cs[i];
      const value = cs.getPropertyValue(property);
      const safe = safeCssValue(property, value);
      if (safe) el.style.setProperty(property, safe);
    }

    el.style.setProperty("box-sizing", "border-box");
  }

  for (const styleEl of Array.from(doc.querySelectorAll("style"))) styleEl.remove();
  for (const link of Array.from(doc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'))) link.remove();
}

function sanitizeClonedDoc(doc: Document, root: HTMLElement, renderWidth: number) {
  root.style.width = `${renderWidth}px`;
  root.style.minWidth = `${renderWidth}px`;
  root.style.maxWidth = `${renderWidth}px`;
  root.style.minHeight = "0";
  root.style.height = "auto";
  root.style.margin = "0";
  root.style.boxShadow = "none";
  root.style.borderRadius = "0";
  root.style.background = "#ffffff";

  inlineComputedStyles(doc, root);

  root.style.setProperty("width", `${renderWidth}px`, "important");
  root.style.setProperty("min-width", `${renderWidth}px`, "important");
  root.style.setProperty("max-width", `${renderWidth}px`, "important");
  root.style.setProperty("min-height", "0", "important");
  root.style.setProperty("height", "auto", "important");
  root.style.setProperty("margin", "0", "important");
  root.style.setProperty("box-shadow", "none", "important");
  root.style.setProperty("border-radius", "0", "important");
}

export async function exportResumePdf(element: HTMLElement, draft: ResumeDraft): Promise<ExportMode> {
  await new Promise<void>((r) => requestAnimationFrame(() => r()));

  try {
    // Capture the exact CSS width the user is currently looking at. This is
    // the key difference from the previous fixed-width exporter: responsive
    // columns and text wrapping now match the live preview.
    const renderWidth = Math.max(1, Math.round(element.getBoundingClientRect().width));
    const renderHeight = Math.max(1, Math.round(element.scrollHeight));

    console.info("[PDF] starting WYSIWYG export", {
      template: draft.template,
      viewportWidth: element.clientWidth,
      exportWidth: renderWidth,
      height: renderHeight,
    });

    const canvas = await html2canvas(element, {
      scale: CAPTURE_SCALE,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      width: renderWidth,
      height: renderHeight,
      windowWidth: renderWidth,
      windowHeight: renderHeight,
      imageTimeout: 15000,
      foreignObjectRendering: false,
      removeContainer: true,
      onclone: (doc, node) => sanitizeClonedDoc(doc, node as HTMLElement, renderWidth),
    });

    const pdf = new jsPDF({ unit: "pt", format: "letter", compress: true });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    const naturalImgH = (canvas.height * pageW) / canvas.width;
    const isOnePage = naturalImgH <= pageH * ONE_PAGE_TOLERANCE;

    if (isOnePage) {
      // Keep the entire preview on one page when it is only slightly taller
      // than the PDF page. The uniform scale preserves the preview exactly.
      const fitScale = Math.min(1, pageH / naturalImgH);
      const imgW = pageW * fitScale;
      const imgH = naturalImgH * fitScale;
      const x = (pageW - imgW) / 2;
      pdf.addImage(imgData, "JPEG", x, 0, imgW, imgH);
    } else {
      // Genuine multi-page resumes are split vertically without changing the
      // captured layout, so no text is reflowed during PDF pagination.
      const fullImgH = naturalImgH;
      let heightLeft = fullImgH;
      let position = 0;
      pdf.addImage(imgData, "JPEG", 0, position, pageW, fullImgH);
      heightLeft -= pageH;
      while (heightLeft > 0) {
        position = heightLeft - fullImgH;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, pageW, fullImgH);
        heightLeft -= pageH;
      }
    }

    const name = (draft.contact.name || "draft").replace(/\s+/g, "_");
    pdf.save(`Resume-${name}.pdf`);
    console.info("[PDF] WYSIWYG export complete", {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      pages: pdf.getNumberOfPages(),
      onePageFit: isOnePage,
    });
    return "wysiwyg";
  } catch (err) {
    console.error("[PDF] WYSIWYG export failed, using safe fallback", err);
    exportResumePdfSafe(draft);
    return "fallback";
  }
}
