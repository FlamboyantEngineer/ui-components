// A one-page sample built in the lab for accent-aware and whole-word find: the same word written
// with a composed accent, a decomposed accent and none, beside longer words that contain it.

/** The page's lines; `́` is a combining acute accent after a plain letter. */
export const accentSampleLines = [
  'Café menu',
  'Café au lait, café crème and a cafe filtre.',
  'Café noir, written with a separate accent.',
  'The cafeteria and two cafes open at noon.',
] as const;

// Byte 0x80 draws an acute accent and reads as the combining acute accent.
const combiningAcute = '́';
const combiningCode = 0x80;

function encodeLine(line: string): string {
  let encoded = '';
  for (const character of line) {
    const code = character === combiningAcute ? combiningCode : (character.codePointAt(0) ?? 0);
    if (code > 0xff) throw new Error(`Cannot encode ${character}`);
    const byte = String.fromCharCode(code);
    encoded += byte === '\\' || byte === '(' || byte === ')' ? `\\${byte}` : byte;
  }
  return encoded;
}

const toUnicode = [
  '/CIDInit /ProcSet findresource begin 12 dict begin begincmap',
  '/CMapName /Lab-Accents def /CMapType 2 def',
  '1 begincodespacerange <00> <FF> endcodespacerange',
  '2 beginbfrange <20> <7E> <0020> <A0> <FF> <00A0> endbfrange',
  `1 beginbfchar <80> <0301> endbfchar`,
  'endcmap CMapName currentdict /CMap defineresource pop end end',
].join('\n');

/** The sample as a text-only PDF of one 420 by 595 point page. */
export function createAccentPdf(): Uint8Array {
  const content = accentSampleLines
    .map(
      (line, index) =>
        `BT /F1 ${index === 0 ? 18 : 12} Tf 48 ${520 - index * 28} Td (${encodeLine(line)}) Tj ET`,
    )
    .join('\n');
  const objects = [
    '',
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 420 595] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /ToUnicode 6 0 R ' +
      `/Encoding << /Type /Encoding /BaseEncoding /WinAnsiEncoding /Differences [${combiningCode} /acute] >> >>`,
    `<< /Length ${toUnicode.length} >>\nstream\n${toUnicode}\nendstream`,
  ];
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
  return Uint8Array.from(body, (character) => character.charCodeAt(0));
}
