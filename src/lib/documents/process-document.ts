import { readFile } from "fs/promises";

type ProcessDocumentInput = {
  filePath: string;
  fileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
};

type ProcessDocumentResult = {
  extractedText: string | null;
  processingSummary: string;
};

function buildTextSummary(text: string) {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  const preview = normalized.split("\n").slice(0, 3).join(" ").slice(0, 180);
  const lines = normalized ? normalized.split("\n").length : 0;
  const words = normalized ? normalized.split(/\s+/).filter(Boolean).length : 0;

  if (!normalized) {
    return {
      extractedText: "",
      processingSummary: "Stored file successfully, but the text document was empty.",
    };
  }

  return {
    extractedText: normalized,
    processingSummary: `Extracted ${words} words across ${lines} lines. Preview: ${preview}`,
  };
}

function buildStoredFileSummary(input: ProcessDocumentInput) {
  const sizeText =
    typeof input.fileSize === "number"
      ? `${(input.fileSize / 1024).toFixed(1)} KB`
      : "unknown size";
  const nameText = input.fileName ?? "uploaded file";
  const typeText = input.mimeType ?? "unknown type";

  return `Stored ${nameText} (${typeText}, ${sizeText}). Content extraction for this file type has not been implemented yet.`;
}

export async function processDocumentFile(
  input: ProcessDocumentInput
): Promise<ProcessDocumentResult> {
  if (input.mimeType === "text/plain") {
    const buffer = await readFile(input.filePath);
    return buildTextSummary(buffer.toString("utf8"));
  }

  return {
    extractedText: null,
    processingSummary: buildStoredFileSummary(input),
  };
}
