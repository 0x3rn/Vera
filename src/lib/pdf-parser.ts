"use server";

import { PDFParse } from "pdf-parse";

export async function parsePdfBuffer(buffer: ArrayBuffer): Promise<string> {
  const uint8 = new Uint8Array(buffer);
  const parser = new PDFParse({ data: uint8 });
  const result = await parser.getText();
  return result.text;
}
