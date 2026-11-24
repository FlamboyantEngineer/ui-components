// Text inside a PNG: international text chunks (`iTXt`, UTF-8, uncompressed) written after the
// header chunk, and the `tEXt` and uncompressed `iTXt` chunks read back, so an image can carry the
// source it was drawn from (specs/CLIPBOARD.md, UIC-CLIPBOARD-1.9).

const SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
// The signature, then the header chunk: length, type, 13 bytes of data and its check.
const HEADER_END = 33;

let crcTable: Uint32Array | null = null;

function crc32(bytes: Uint8Array): number {
  crcTable ??= Uint32Array.from({ length: 256 }, (_, index) => {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1)
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    return value;
  });
  let crc = 0xffffffff;
  for (const byte of bytes) crc = (crcTable[(crc ^ byte) & 0xff] ?? 0) ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/** An `iTXt` chunk: keyword, no compression, no language or translated keyword, UTF-8 text. */
function textChunk(keyword: string, text: string): Uint8Array<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = [...encoder.encode(keyword), 0, 0, 0, 0, 0, ...encoder.encode(text)];
  const chunk = new Uint8Array(12 + data.length);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, data.length);
  chunk.set(encoder.encode('iTXt'), 4);
  chunk.set(data, 8);
  view.setUint32(8 + data.length, crc32(chunk.subarray(4, 8 + data.length)));
  return chunk;
}

const isPng = (bytes: Uint8Array) => SIGNATURE.every((byte, index) => bytes[index] === byte);

/**
 * The PNG with each entry as a text chunk right after its header. Keywords are 1 to 79 Latin
 * letters, digits, spaces or punctuation; a blob that is not a PNG comes back unchanged.
 */
export async function withPngText(png: Blob, entries: Record<string, string>): Promise<Blob> {
  const head = new Uint8Array(await png.slice(0, HEADER_END).arrayBuffer());
  if (head.length < HEADER_END || !isPng(head)) return png;
  const chunks = Object.entries(entries)
    .filter(([keyword]) => /^[\x20-\x7e]{1,79}$/.test(keyword))
    .map(([keyword, text]) => textChunk(keyword, text));
  return new Blob([head, ...chunks, png.slice(HEADER_END)], { type: 'image/png' });
}

/** The text a PNG carries in `tEXt` and uncompressed `iTXt` chunks, by keyword; empty otherwise. */
export async function readPngText(image: Blob): Promise<Record<string, string>> {
  const bytes = new Uint8Array(await image.arrayBuffer());
  const found: Record<string, string> = {};
  if (!isPng(bytes)) return found;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const latin = new TextDecoder('latin1');
  const utf8 = new TextDecoder();
  for (let at = SIGNATURE.length; at + 12 <= bytes.length;) {
    const length = view.getUint32(at);
    const type = latin.decode(bytes.subarray(at + 4, at + 8));
    const data = bytes.subarray(at + 8, Math.min(bytes.length, at + 8 + length));
    if (type === 'IEND') break;
    const end = data.indexOf(0);
    if (end > 0 && type === 'tEXt')
      found[latin.decode(data.subarray(0, end))] = latin.decode(data.subarray(end + 1));
    if (end > 0 && type === 'iTXt' && data[end + 1] === 0) {
      const language = data.indexOf(0, end + 3);
      const translated = language < 0 ? -1 : data.indexOf(0, language + 1);
      if (translated >= 0)
        found[latin.decode(data.subarray(0, end))] = utf8.decode(data.subarray(translated + 1));
    }
    at += 12 + length;
  }
  return found;
}
