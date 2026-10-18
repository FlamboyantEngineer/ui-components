import { describe, expect, it } from 'vitest';
import { compareFileItems, restoreFileItem, type FileFieldItem } from './file-field-changes.js';

const report: FileFieldItem = { id: 'report', name: 'Report.pdf' };
const photo: FileFieldItem = { id: 'photo', name: 'Photo.png' };
const notes: FileFieldItem = { id: 'notes', name: 'Notes.txt' };
const song: FileFieldItem = { id: 'song', name: 'Song.ogg' };

describe('file field changes', () => {
  it('UIC-FILE-FIELD-3.1 compares the value with the committed value by id', () => {
    const changes = compareFileItems([report, song], [report, photo, notes]);
    expect([...changes.added]).toEqual(['song']);
    expect(changes.removed).toEqual([photo, notes]);
    expect(compareFileItems([report], [{ ...report, name: 'Renamed.pdf' }]).removed).toEqual([]);
  });

  it('UIC-FILE-FIELD-3.2 puts a removed file back in its committed place', () => {
    const committed = [report, photo, notes];
    expect(restoreFileItem([report, notes], committed, photo)).toEqual([report, photo, notes]);
    expect(restoreFileItem([photo, song], committed, report)).toEqual([report, photo, song]);
    expect(restoreFileItem([report, song], committed, notes)).toEqual([report, notes, song]);
    expect(restoreFileItem([], committed, notes)).toEqual([notes]);
  });
});
