import { describe, expect, it } from 'vitest';
import { partitionFiles } from './file-rules.js';

function file(name: string, type: string, size = 10): File {
  return new File(['x'.repeat(size)], name, { type });
}

describe('partitionFiles', () => {
  it('UIC-FILE-UPLOAD-2.1 accepts files by extension, exact type or type family, ignoring case', () => {
    const report = file('Report.PDF', 'application/pdf');
    const photo = file('photo.jpg', 'image/JPEG');
    const icon = file('icon.png', 'image/png');
    const notes = file('notes.txt', 'text/plain');
    const result = partitionFiles([report, photo, icon, notes], {
      acceptedFileTypes: ['.pdf', 'image/*', ' ', 'text/csv'],
    });
    expect(result.accepted).toEqual([report, photo, icon]);
    expect(result.rejections).toEqual([{ file: notes, reason: 'type' }]);
    expect(
      partitionFiles([notes], { acceptedFileTypes: ['IMAGE/PNG', 'TEXT/PLAIN'] }).accepted,
    ).toEqual([notes]);
  });

  it('UIC-FILE-UPLOAD-2.1 accepts any type without a list', () => {
    const notes = file('notes.txt', 'text/plain');
    expect(partitionFiles([notes], {}).accepted).toEqual([notes]);
    expect(partitionFiles([notes], { acceptedFileTypes: [] }).accepted).toEqual([notes]);
  });

  it('UIC-FILE-UPLOAD-2.2 refuses files larger than the size limit, after the type check', () => {
    const small = file('small.png', 'image/png', 5);
    const exact = file('exact.png', 'image/png', 8);
    const large = file('large.png', 'image/png', 9);
    const wrong = file('large.txt', 'text/plain', 9);
    const result = partitionFiles([small, exact, large, wrong], {
      acceptedFileTypes: ['image/*'],
      maxSize: 8,
    });
    expect(result.accepted).toEqual([small, exact]);
    expect(result.rejections).toEqual([
      { file: large, reason: 'size' },
      { file: wrong, reason: 'type' },
    ]);
    expect(partitionFiles([large], { maxSize: 0 }).accepted).toEqual([large]);
  });
});
