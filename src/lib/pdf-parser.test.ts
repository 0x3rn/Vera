import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parsePdfBuffer } from "./pdf-parser";

describe("isolated PDF parsing", () => {
  it("parses a valid PDF in the worker and returns page metadata", async () => {
    const file = await readFile(path.join(process.cwd(), "node_modules", "pdf-parse", "test", "data", "01-valid.pdf"));
    const buffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer;

    const result = await parsePdfBuffer(buffer);

    expect(result.pages).toBe(14);
    expect(result.text).toContain("Because traces are in SSA form");
  }, 15_000);
});
