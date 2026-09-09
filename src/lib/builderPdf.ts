import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { ResumeDraft } from "./resumeDraft";
import { exportResumePdfSafe } from "./builderPdfFallback";
import { exportEditorialCvPdf } from "./editorialCvPdf";

/**
 * WYSIWYG PDF export with automatic fallback.
 *
 * The live preview is responsive, so its width can become very narrow on a
 * phone. Capturing that responsive width directly makes text wrap into many
 * extra lines and can turn a one-page resume into a multi-page PDF.
 *
 * For PDF generation we render the preview at a stable desktop width and
 * inline the cloned preview's computed styles before html2canvas parses it.
 * This avoids Tailwind v4 color functions such as oklch causing html2canvas
 * to abort and silently switch to the old text-only fallback exporter.
 */
export type ExportMode = "wysiwyg" | "fallback";

const UNSUPPORTED_COLOR_RE = /(oklch|oklab|lab\(|lch\(|color\(|color-mix)/i;
const PDF_RENDER_WIDTH = 760;
const ONE_PAGE_TOLERANCE = 1.08;

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
  const nodes: Element[] = [root, ...Array.from(root.querySelectorAll("*"))];

  for (const el of nodes) {
    if (!(el instanceof HTMLElement) && !(el instanceof SVGElement)) continue;
    const cs = doc.defaultView?.getComputedStyle(el);
    if (!cs) continue;

    for (let i = 0; i < cs.length; i += 1) {
      const property = cs[i];
      const value = cs.getPropertyValue(property);
      const safe = safeCssValue(property, value);
      if (safe) (el as HTMLElement).style.setProperty(property, safe);
    }

    (el as HTMLElement).style.setProperty("box-sizing", "border-box");
  }

  for (const styleEl of Array.from(doc.querySelectorAll("style"))) styleEl.remove();
  for (const link of Array.from(doc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'))) link.remove();
}

function sanitizeClonedDoc(doc: Document, root: HTMLElement) {
  root.style.width = `${PDF_RENDER_WIDTH}px`;
  root.style.minWidth = `${PDF_RENDER_WIDTH}px`;
  root.style.maxWidth = `${PDF_RENDER_WIDTH}px`;
  root.style.minHeight = "0";
  root.style.height = "auto";
  root.style.margin = "0";
  root.style.boxShadow = "none";
  root.style.borderRadius = "0";
  root.style.background = "#ffffff";

  inlineComputedStyles(doc, root);

  root.style.setProperty("width", `${PDF_RENDER_WIDTH}px`, "important");
  root.style.setProperty("min-width", `${PDF_RENDER_WIDTH}px`, "important");
  root.style.setProperty("max-width", `${PDF_RENDER_WIDTH}px`, "important");
  root.style.setProperty("min-height", "0", "important");
  root.style.setProperty("height", "auto", "important");
  root.style.setProperty("margin", "0", "important");
  root.style.setProperty("box-shadow", "none", "important");
  root.style.setProperty("border-radius", "0", "important");
}

async function captureWysiwyg(element: HTMLElement, foreignObjectRendering: boolean) {
  return html2canvas(element, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
    width: PDF_RENDER_WIDTH,
    windowWidth: PDF_RENDER_WIDTH,
    imageTimeout: 15000,
    foreignObjectRendering,
    removeContainer: true,
    onclone: (doc, node) => sanitizeClonedDoc(doc, node as HTMLElement),
  });
}

export async function exportResumePdf(element: HTMLElement, draft: ResumeDraft): Promise<ExportMode> {
  await new Promise<void>((r) => requestAnimationFrame(() => r()));

  try {
    // Editorial CV is the only template using the deterministic jsPDF renderer.
    // All other templates retain the existing WYSIWYG export path.
    if (draft.template === "editorial-cv") {
      exportEditorialCvPdf(draft);
      console.info("[PDF] Editorial CV deterministic export complete");
      return "wysiwyg";
    }

    console.info("[PDF] starting WYSIWYG export", {
      template: draft.template,
      viewportWidth: element.clientWidth,
      exportWidth: PDF_RENDER_WIDTH,
      height: element.scrollHeight,
    });

    let canvas;
    try {
      canvas = await captureWysiwyg(element, false);
    } catch (primaryError) {
      // Some browser/template combinations still fail html2canvas's normal
      // renderer even after CSS sanitization. Retry with SVG foreignObject
      // rendering before falling back to the text-only PDF. This keeps the
      // actual template design instead of silently producing a different CV.
      console.warn("[PDF] primary capture failed, retrying foreignObject renderer", primaryError);
      canvas = await captureWysiwyg(element, true);
    }

    const pdf = new jsPDF({ unit: "pt", format: "letter", compress: true });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    const naturalImgH = (canvas.height * pageW) / canvas.width;
    const isOnePage = naturalImgH <= pageH * ONE_PAGE_TOLERANCE;

    if (isOnePage) {
      const fitScale = Math.min(1, pageH / naturalImgH);
      const imgW = pageW * fitScale;
      const imgH = naturalImgH * fitScale;
      const x = (pageW - imgW) / 2;
      pdf.addImage(imgData, "JPEG", x, 0, imgW, imgH);
    } else {
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
    console.error("[PDF] WYSIWYG export failed after retry, using safe fallback", err);
    exportResumePdfSafe(draft);
    return "fallback";
  }
}
