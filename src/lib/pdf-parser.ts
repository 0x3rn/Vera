// Server-side PDF parsing utility

export async function parsePdfBuffer(buffer: ArrayBuffer): Promise<string> {
  // Polyfill DOMMatrix for Node < 21 (Vercel default) before loading pdfjs-dist
  if (typeof global.DOMMatrix === "undefined") {
    global.DOMMatrix = class DOMMatrix {
      constructor() {}
    } as any;
  }

  // Dynamically import pdfjs-dist so it doesn't crash the serverless function on boot
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

  // Disable workers for Next.js server compatibility
  pdfjs.GlobalWorkerOptions.workerSrc = "";

  const uint8 = new Uint8Array(buffer);
  const doc = await pdfjs.getDocument({ data: uint8 }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => item.str || "")
      .join(" ");
    pages.push(pageText);
  }

  return pages.join("\n\n");
}