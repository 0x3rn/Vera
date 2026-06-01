"use server";

import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

// Disable workers for Next.js server compatibility
pdfjs.GlobalWorkerOptions.workerSrc = "";

export async function parsePdfBuffer(buffer: ArrayBuffer): Promise<string> {
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