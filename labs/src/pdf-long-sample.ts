// A long sample document built in the lab, so the viewer can be measured on hundreds of pages
// without keeping a large binary in the repository.

/** The page of the long sample that alone holds the word `quinceberry`. */
export const longSampleMarkedPage = 248;

function escapeText(text: string): string {
  return text.replace(/[\\()]/g, (character) => `\\${character}`);
}

function pageContent(pageNumber: number, pageCount: number): string {
  const lines = [
    `Long Report, page ${pageNumber}`,
    `Section ${Math.ceil(pageNumber / 10)}: rows ${pageNumber * 10 - 9} to ${pageNumber * 10}.`,
    pageNumber === longSampleMarkedPage
      ? 'The quinceberry harvest closes the report.'
      : 'Orchard rows were walked and counted.',
    `Page ${pageNumber} of ${pageCount}`,
  ];
  return lines
    .map(
      (line, index) =>
        `BT /F1 ${index === 0 ? 18 : 12} Tf 48 ${520 - index * 28} Td (${escapeText(line)}) Tj ET`,
    )
    .join('\n');
}

/** A text-only PDF of `pageCount` pages, each 420 by 595 points. */
export function createLongPdf(pageCount: number): Uint8Array {
  const objects: string[] = [];
  const pageIds = Array.from({ length: pageCount }, (_, index) => 4 + index * 2);
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageCount} >>`;
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
  pageIds.forEach((id, index) => {
    const content = pageContent(index + 1, pageCount);
    objects[id] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 420 595] ` +
      `/Resources << /Font << /F1 3 0 R >> >> /Contents ${id + 1} 0 R >>`;
    objects[id + 1] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;
  });
  let body = '%PDF-1.4\n';
  const offsets: number[] = [];
  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = body.length;
    body += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const xref = body.length;
  const entries = offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`)
    .join('');
  body +=
    `xref\n0 ${objects.length}\n0000000000 65535 f \n${entries}` +
    `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(body);
}
