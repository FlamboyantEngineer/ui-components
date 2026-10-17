import { describe, expect, it } from 'vitest';
import { canAcceptDrag, partitionFiles, type FilePartition, type FileRules } from './file-rules.js';

function file(name: string, type: string, size = 10): File {
  return new File(['x'.repeat(size)], name, { type });
}

/** Partitions files with rules that answer at once. */
function sort(files: File[], rules: FileRules, held = 0): FilePartition {
  const result = partitionFiles(files, rules, held);
  if (result instanceof Promise) throw new Error('answered later');
  return result;
}

describe('partitionFiles', () => {
  it('UIC-FILE-UPLOAD-2.1 accepts files by extension, exact type or type family, ignoring case', () => {
    const report = file('Report.PDF', 'application/pdf');
    const photo = file('photo.jpg', 'image/JPEG');
    const icon = file('icon.png', 'image/png');
    const notes = file('notes.txt', 'text/plain');
    const result = sort([report, photo, icon, notes], {
      acceptedFileTypes: ['.pdf', 'image/*', ' ', 'text/csv'],
    });
    expect(result.accepted).toEqual([report, photo, icon]);
    expect(result.rejections).toEqual([{ file: notes, reason: 'type' }]);
    expect(sort([notes], { acceptedFileTypes: ['IMAGE/PNG', 'TEXT/PLAIN'] }).accepted).toEqual([
      notes,
    ]);
  });

  it('UIC-FILE-UPLOAD-2.1 accepts any type without a list', () => {
    const notes = file('notes.txt', 'text/plain');
    expect(sort([notes], {}).accepted).toEqual([notes]);
    expect(sort([notes], { acceptedFileTypes: [] }).accepted).toEqual([notes]);
  });

  it('UIC-FILE-UPLOAD-2.2 refuses files larger than the size limit, after the type check', () => {
    const small = file('small.png', 'image/png', 5);
    const exact = file('exact.png', 'image/png', 8);
    const large = file('large.png', 'image/png', 9);
    const wrong = file('large.txt', 'text/plain', 9);
    const result = sort([small, exact, large, wrong], {
      acceptedFileTypes: ['image/*'],
      maxSize: 8,
    });
    expect(result.accepted).toEqual([small, exact]);
    expect(result.rejections).toEqual([
      { file: large, reason: 'size' },
      { file: wrong, reason: 'type' },
    ]);
    expect(sort([large], { maxSize: 0 }).accepted).toEqual([large]);
  });

  it('UIC-FILE-UPLOAD-2.5 refuses files smaller than the minimum size', () => {
    const empty = file('empty.txt', 'text/plain', 0);
    const enough = file('enough.txt', 'text/plain', 4);
    expect(sort([empty, enough], { minSize: 4 }).rejections).toEqual([
      { file: empty, reason: 'min-size' },
    ]);
  });

  it('UIC-FILE-UPLOAD-2.6 refuses files past the count limit, counting the listed ones', () => {
    const [a, b, c] = ['a.txt', 'b.txt', 'c.txt'].map((name) => file(name, 'text/plain'));
    const result = sort([a, b, c] as File[], { maxFiles: 3, maxSize: 20 }, 1);
    expect(result.accepted).toEqual([a, b]);
    expect(result.rejections).toEqual([{ file: c, reason: 'count' }]);
    const big = file('big.txt', 'text/plain', 30);
    expect(sort([big, c] as File[], { maxFiles: 1, maxSize: 20 }).accepted).toEqual([c]);
  });

  it('UIC-FILE-UPLOAD-2.7 refuses files the caller check rejects, given the files accepted before', () => {
    const [a, b, again] = ['a.txt', 'b.txt', 'a.txt'].map((name) => file(name, 'text/plain'));
    const unique = (candidate: File, accepted: readonly File[]) =>
      accepted.some(({ name }) => name === candidate.name) ? 'Already chosen.' : null;
    const result = sort([a, b, again] as File[], { validate: unique, maxFiles: 2 });
    expect(result.accepted).toEqual([a, b]);
    expect(result.rejections).toEqual([
      { file: again, reason: 'invalid', message: 'Already chosen.' },
    ]);
  });

  it('UIC-FILE-UPLOAD-2.7 waits for a caller check that answers later', async () => {
    const [a, b] = ['a.png', 'b.png'].map((name) => file(name, 'image/png'));
    const result = partitionFiles([a, b] as File[], {
      validate: async (candidate) => (candidate.name === 'b.png' ? 'Too narrow.' : null),
    });
    expect(result).toBeInstanceOf(Promise);
    expect(await result).toEqual({
      accepted: [a],
      rejections: [{ file: b, reason: 'invalid', message: 'Too narrow.' }],
    });
  });
});

describe('canAcceptDrag', () => {
  const png = { kind: 'file', type: 'image/png' };
  const text = { kind: 'file', type: 'text/plain' };
  it('UIC-FILE-UPLOAD-2.8 judges a drag by its count and MIME types', () => {
    expect(canAcceptDrag([png, text], {})).toBe(true);
    expect(canAcceptDrag([png], { acceptedFileTypes: ['image/*'] })).toBe(true);
    expect(canAcceptDrag([png, text], { acceptedFileTypes: ['image/*'] })).toBe(false);
    expect(canAcceptDrag([text], { acceptedFileTypes: ['image/*', '.txt'] })).toBe(true);
    expect(canAcceptDrag([{ kind: 'file', type: '' }], { acceptedFileTypes: ['image/*'] })).toBe(
      true,
    );
    expect(canAcceptDrag([png, png], { maxFiles: 2 }, 1)).toBe(false);
    expect(canAcceptDrag([png, { kind: 'string', type: 'text/plain' }], { maxFiles: 1 })).toBe(
      true,
    );
  });
});
