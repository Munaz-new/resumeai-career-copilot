import type { AtsConfidence } from "@/lib/fileParser";

export interface ImageQuality {
  width: number;
  height: number;
  ok: boolean;
  confidence: AtsConfidence;
  warning?: string;
}

// Minimum dimensions for a reasonably legible resume scan/screenshot.
const MIN_GOOD_WIDTH = 1000;
const MIN_GOOD_HEIGHT = 1200;
const MIN_OK_WIDTH = 700;
const MIN_OK_HEIGHT = 800;

/**
 * Inspect image dimensions to derive an honest ATS confidence level.
 * We never inflate confidence — image resumes start at "medium" at best
 * until a real OCR engine can measure word-level confidence.
 */
export function assessImageQuality(file: File): Promise<ImageQuality> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      URL.revokeObjectURL(url);

      if (width >= MIN_GOOD_WIDTH && height >= MIN_GOOD_HEIGHT) {
        resolve({ width, height, ok: true, confidence: "medium" });
        return;
      }
      if (width >= MIN_OK_WIDTH && height >= MIN_OK_HEIGHT) {
        resolve({
          width,
          height,
          ok: true,
          confidence: "low",
          warning: "Low image quality detected. ATS analysis may be less accurate.",
        });
        return;
      }
      resolve({
        width,
        height,
        ok: false,
        confidence: "low",
        warning: "Low image quality detected. ATS analysis may be less accurate.",
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: 0,
        height: 0,
        ok: false,
        confidence: "low",
        warning: "Could not read this image. ATS analysis may be unreliable.",
      });
    };
    img.src = url;
  });
}
