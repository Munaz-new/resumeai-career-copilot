import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { ResumeDraft } from "./resumeDraft";
import { exportResumePdfSafe } from "./builderPdfFallback";

/**
 * WYSIWYG PDF export with automatic fallback.
 *
 * Tries to rasterize the live preview DOM (so the PDF matches the selected
 * template exactly). If html2canvas throws — typically due to modern CSS
 * color functions like oklch()/color-mix() inherited from theme tokens —
 * we fall back to a safe text-based PDF so the user always gets a download.
 *
 * Returns the export mode actually used.
 */
export type ExportMode = "wysiwyg" | "fallback";

const UNSUPPORTED_COLOR_RE = /(oklch|oklab|lab\(|lch\(|color\(|color-mix)/i;

function sanitizeClonedDoc(doc: Document, root: HTMLElement) {
  // Force exact color rendering and a clean white background on the clone.
  const style = doc.createElement("style");
  style.textContent = `
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
  `;
  doc.head.appendChild(style);
  root.style.background = "#ffffff";

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
      width: element.scrollWidth,
      height: element.scrollHeight,
    });

    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      windowWidth: element.scrollWidth,
      imageTimeout: 15000,
      foreignObjectRendering: false,
      removeContainer: true,
      onclone: (doc, node) => sanitizeClonedDoc(doc, node as HTMLElement),
    });

    const pdf = new jsPDF({ unit: "pt", format: "letter", compress: true });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;
    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    if (imgH <= pageH) {
      pdf.addImage(imgData, "JPEG", 0, 0, imgW, imgH);
    } else {
      let heightLeft = imgH;
      let position = 0;
      pdf.addImage(imgData, "JPEG", 0, position, imgW, imgH);
      heightLeft -= pageH;
      while (heightLeft > 0) {
        position = heightLeft - imgH;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgW, imgH);
        heightLeft -= pageH;
      }
    }

    const name = (draft.contact.name || "draft").replace(/\s+/g, "_");
    pdf.save(`Resume-${name}.pdf`);
    console.info("[PDF] WYSIWYG export complete");
    return "wysiwyg";
  } catch (err) {
    console.error("[PDF] WYSIWYG export failed, using safe fallback", err);
    exportResumePdfSafe(draft);
    return "fallback";
  }
}
