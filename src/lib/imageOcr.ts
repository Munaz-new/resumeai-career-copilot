type OcrWorker = {
  recognize: (image: File | Blob | HTMLCanvasElement) => Promise<{ data: { text: string } }>;
  terminate: () => Promise<unknown>;
};

type TesseractApi = {
  createWorker: (
    language: string,
    oem?: number,
    options?: { logger?: (message: { status?: string; progress?: number }) => void }
  ) => Promise<OcrWorker>;
};

declare global {
  interface Window {
    Tesseract?: TesseractApi;
  }
}

const TESSERACT_SCRIPT = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
let tesseractPromise: Promise<TesseractApi> | null = null;

function loadTesseract(): Promise<TesseractApi> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("OCR is only available in the browser."));
  }

  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  if (tesseractPromise) return tesseractPromise;

  tesseractPromise = new Promise<TesseractApi>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${TESSERACT_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener("load", () => {
        if (window.Tesseract) resolve(window.Tesseract);
        else reject(new Error("OCR engine loaded without the Tesseract API."));
      }, { once: true });
      existing.addEventListener("error", () => reject(new Error("Unable to load the OCR engine.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = TESSERACT_SCRIPT;
    script.async = true;
    script.onload = () => {
      if (window.Tesseract) resolve(window.Tesseract);
      else reject(new Error("OCR engine loaded without the Tesseract API."));
    };
    script.onerror = () => reject(new Error("Unable to load the OCR engine."));
    document.head.appendChild(script);
  }).catch((error) => {
    tesseractPromise = null;
    throw error;
  });

  return tesseractPromise;
}

async function prepareImage(file: File): Promise<HTMLCanvasElement> {
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Unable to decode the resume image."));
      img.src = url;
    });

    const scale = Math.min(2, Math.max(1, 1800 / Math.max(image.width, image.height)));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));

    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Unable to prepare the resume image.");

    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < pixels.data.length; i += 4) {
      const gray = Math.round(
        pixels.data[i] * 0.299 + pixels.data[i + 1] * 0.587 + pixels.data[i + 2] * 0.114
      );
      pixels.data[i] = gray;
      pixels.data[i + 1] = gray;
      pixels.data[i + 2] = gray;
    }
    context.putImageData(pixels, 0, 0);

    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function runImageOcr(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ text: string; confidence: "high" | "medium" | "low" }> {
  const tesseract = await loadTesseract();
  const canvas = await prepareImage(file);

  const worker = await tesseract.createWorker("eng", 1, {
    logger: (message) => {
      if (typeof message.progress === "number") {
        onProgress?.(Math.max(0, Math.min(1, message.progress)));
      }
    },
  });

  try {
    const result = await worker.recognize(canvas);
    const text = result.data.text.replace(/\r\n?/g, "\n").trim();
    const confidence = text.length >= 120 ? "high" : text.length >= 50 ? "medium" : "low";
    return { text, confidence };
  } finally {
    await worker.terminate();
  }
}
