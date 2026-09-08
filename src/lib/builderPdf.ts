import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { ResumeDraft } from "./resumeDraft";
import { exportResumePdfSafe } from "./builderPdfFallback";

/**
 * WYSIWYG PDF export with automatic fallback.
 *
 * The live preview is responsive, so its width can become very narrow on a
 * phone. Capturing that responsive width directly makes text wrap into many
 * extra lines and can turn a one-page resume into a multi-page PDF.
 *
 * For PDF generation we therefore render the preview at its desktop/export
 * width, independent of the device viewport, and remove the preview's screen-only minimum height. The resulting canvas is then fitted/paginated against the PDF page size.
 */
export type ExportMode = "wysiwyg" | "fallback";

const UNSUPPORTED_COLOR_RE = /(oklch|oklab|lab\(|lch\(|color\(|color-mix)/i;
const PDF_RENDER_WIDTH = 760;

function stripUnsupportedStyles(doc: Document) {
  // html2canvas can fail while parsing the original stylesheet even when the
  // affected color is not ultimately used by the resume. Remove only CSS
  // declarations containing unsupported color functions from cloned <style>
  // tags so visual templates can still be captured as WYSIWYG.
  for (const styleEl of Array.from(doc.querySelectorAll("style"))) {
    const css = styleEl.textContent || "";
    if (!UNSUPPORTED_COLOR_RE.test(css)) continue;
    const sanitized = css.replace(/([\w-]+)\s*:\s*[^;{}]*(?:oklch|oklab|lab\(|lch\(|color\(|color-mix)[^;{}]*;?/gi, "");
    styleEl.textContent = sanitized;
  }
}

function sanitizeClonedDoc(doc: Document, root: HTMLElement) {
  stripUnsupportedStyles(doc);

  // Render the responsive preview at a stable desktop width for PDF output.
  root.style.width = `${PDF_RENDER_WIDTH}px`;
  root.style.minWidth = `${PDF_RENDER_WIDTH}px`;
  root.style.maxWidth = `${PDF_RENDER_WIDTH}px`;
  root.style.minHeight = "0";
  root.style.height = "auto";
  root.style.margin = "0";
  root.style.boxShadow = "none";
  root.style.borderRadius = "0";
  root.style.background = "#ffffff";

  const style = doc.createElement("style");
  style.textContent = `
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    [data-resume-preview] {
      width: ${PDF_RENDER_WIDTH}px !important;
      min-width: ${PDF_RENDER_WIDTH}px !important;
      max-width: ${PDF_RENDER_WIDTH}px !important;
      min-height: 0 !important;
      height: auto !important;
      margin: 0 !important;
      box-sizing: border-box !important;
    }
  `;
  doc.head.appendChild(style);

  // Walk every element and replace any computed color value that uses a
  // CSS function html2canvas cannot parse with a safe fallback.
  const all = root.querySelectorAll<HTMLElement>("*");
  const nodes: HTMLElement[] = [root, ...Array.from(all)];
  const props: (keyof CSSStyleDeclaration)[] = [
    "color",
    "backgroundColor",
    "borderTopColor",
    "borderRightColor",
    "borderBottomColor",
    "borderLeftColor",
    "outlineColor",
    "fill",
    "stroke",
    "boxShadow",
    "backgroundImage",
  ];

  for (const el of nodes) {
    const cs = doc.defaultView?.getComputedStyle(el);
    if (!cs) continue;
    for (const p of props) {
      const v = cs[p] as string | undefined;
      if (!v || typeof v !== "string") continue;
      if (UNSUPPORTED_COLOR_RE.test(v)) {
        if (p === "color") el.style.color = "#111827";
        else if (p === "backgroundColor") el.style.backgroundColor = "#ffffff";
        else if (p === "boxShadow") el.style.boxShadow = "none";
        else if (p === "backgroundImage") el.style.backgroundImage = "none";
        else if (p === "fill") el.style.fill = "#111827";
        else if (p === "stroke") el.style.stroke = "#111827";
        else (el.style as any)[p] = "#e5e7eb";
      }
    }
  }
}

export async function exportResumePdf(element: HTMLElement, draft: ResumeDraft): Promise<ExportMode> {
  // Let the latest paint settle so any in-flight template change is visible.
  await new Promise<void>((r) => requestAnimationFrame(() => r()));

  try {
    console.info("[PDF] starting WYSIWYG export", {
      template: draft.template,
      viewportWidth: element.clientWidth,
      exportWidth: PDF_RENDER_WIDTH,
      height: element.scrollHeight,
    });

    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      width: PDF_RENDER_WIDTH,
      windowWidth: PDF_RENDER_WIDTH,
      imageTimeout: 15000,
      foreignObjectRendering: false,
      removeContainer: true,
      onclone: (doc, node) => sanitizeClonedDoc(doc, node as HTMLElement),
    });

    const pdf = new jsPDF({ unit: "pt", format: "letter", compress: true });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    // Convert the captured canvas to PDF points while preserving its aspect
    // ratio. Fit a genuinely one-page resume to one page; only paginate when
    // the content is actually taller than the available page height.
    const naturalImgH = (canvas.height * pageW) / canvas.width;
    const fitScale = naturalImgH <= pageH ? 1 : pageH / naturalImgH;
    const imgW = pageW * fitScale;
    const imgH = naturalImgH * fitScale;
    const x = (pageW - imgW) / 2;

    if (naturalImgH <= pageH) {
      pdf.addImage(imgData, "JPEG", x, 0, imgW, imgH);
    } else {
      // Preserve the original export width for real multi-page resumes.
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
    });
    return "wysiwyg";
  } catch (err) {
    console.error("[PDF] WYSIWYG export failed, using safe fallback", err);
    exportResumePdfSafe(draft);
    return "fallback";
  }
}
