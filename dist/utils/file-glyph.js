// The glyph that stands for a file of a given MIME type.
const families = [
    ['image/', 'image'],
    ['video/', 'video'],
    ['audio/', 'audio'],
];
/** `image`, `video` or `audio` for a file of that MIME family, else `file`. */
export function getFileGlyph(type) {
    const lower = type?.toLowerCase() ?? '';
    return families.find(([prefix]) => lower.startsWith(prefix))?.[1] ?? 'file';
}
//# sourceMappingURL=file-glyph.js.map