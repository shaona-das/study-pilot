import * as pdfjsLib from "pdfjs-dist";
// Vite resolves this to a URL pointing at the worker file it bundles,
// so pdf.js can run its parsing off the main thread with no server involved.
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

/**
 * Extracts plain text from a PDF File object entirely in the browser.
 */
export async function extractPdfText(file) {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((it) => ("str" in it ? it.str : "")).join(" ");
    text += pageText + "\n";
  }
  return text;
}
