// Server-side PDF parsing utility

export async function parsePdfBuffer(buffer: ArrayBuffer): Promise<string> {
  // Dynamically import pdf-parse so it doesn't crash the serverless function on boot in Vercel
  const { PDFParse } = await import("pdf-parse");
  
  const uint8 = new Uint8Array(buffer);
  const parser = new PDFParse({ data: uint8 });
  const result = await parser.getText();
  return result.text;
}