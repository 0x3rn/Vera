// Server-side PDF parsing utility

export async function parsePdfBuffer(buffer: ArrayBuffer): Promise<string> {
  // Polyfill DOMMatrix for Node < 21 (Vercel default) before loading pdfjs-dist
  if (typeof global.DOMMatrix === "undefined") {
    global.DOMMatrix = class DOMMatrix {
      constructor() {}
    } as any;
  }

  // Dynamically import pdf-parse so it doesn't crash the serverless function on boot
  const { PDFParse } = await import("pdf-parse");

  const uint8 = new Uint8Array(buffer);
  const parser = new PDFParse({ data: uint8 });
  const result = await parser.getText();
  return result.text;
}