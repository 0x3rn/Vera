// Server-side PDF parsing utility

export async function parsePdfBuffer(buffer: ArrayBuffer): Promise<string> {
  // Dynamically import pdf-parse so it doesn't crash the serverless function on boot
  // We use pdf-parse v1.1.1 which is incredibly stable and doesn't rely on workers or canvas
  const pdfParse = (await import("pdf-parse")).default;

  const uint8 = new Uint8Array(buffer);
  const result = await pdfParse(Buffer.from(uint8));
  return result.text;
}