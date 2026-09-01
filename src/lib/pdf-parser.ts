import { Worker } from "node:worker_threads";

export type ParsedPdf = { text: string; pages: number };

const PDF_WORKER_SOURCE = String.raw`
const { parentPort, workerData } = require("node:worker_threads");
const pdfParse = require("pdf-parse");

pdfParse(Buffer.from(workerData), { max: 31 })
  .then((result) => {
    if (typeof result.text !== "string" || typeof result.numpages !== "number") {
      throw new Error("PDF parser returned invalid data.");
    }
    if (result.text.length > 100000) {
      throw new Error("PDF text exceeds the 100,000-character limit.");
    }
    parentPort.postMessage({ text: result.text, pages: result.numpages });
  })
  .catch((error) => parentPort.postMessage({ error: error instanceof Error ? error.message : "PDF parsing failed." }));
`;

export async function parsePdfBuffer(buffer: ArrayBuffer): Promise<ParsedPdf> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(PDF_WORKER_SOURCE, {
      eval: true,
      workerData: Buffer.from(buffer),
    });
    let settled = false;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      void worker.terminate();
      callback();
    };
    const timer = setTimeout(() => finish(() => reject(new Error("PDF parsing timed out."))), 10_000);

    worker.once("message", (message: ParsedPdf | { error: string }) => {
      if ("error" in message) finish(() => reject(new Error(message.error)));
      else finish(() => resolve(message));
    });
    worker.once("error", (error) => finish(() => reject(error)));
    worker.once("exit", (code) => {
      if (code !== 0) finish(() => reject(new Error("PDF parser exited unexpectedly.")));
    });
  });
}
