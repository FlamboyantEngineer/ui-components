import { describe, expect, it } from 'vitest';
import { requireDefined } from '../../utils/require-defined.js';
import { highlightTextRuns } from './highlights.js';

function createRuns(texts: string[]) {
  return texts.map((text) => {
    const run = document.createElement('span');
    run.textContent = text;
    return run;
  });
}

describe('highlightTextRuns', () => {
  it('UIC-PDF-VIEWER-5.1 wraps matches in match elements, marks the current one and restores', () => {
    const texts = ['The pear harvest', 'harvest time'];
    const runs = createRuns(texts);
    const highlighted = highlightTextRuns({
      runs,
      texts,
      ranges: [
        { run: 0, start: 4, end: 8, isCurrent: false },
        { run: 0, start: 9, end: 16, isCurrent: true },
        { run: 1, start: 0, end: 7, isCurrent: false },
      ],
    });
    const marks = runs.flatMap((run) => [...run.querySelectorAll('.ui-pdf-viewer__match')]);
    expect(marks.map((mark) => mark.textContent)).toEqual(['pear', 'harvest', 'harvest']);
    expect(runs[0]?.textContent).toBe('The pear harvest');
    expect(highlighted.current).toBe(marks[1]);
    expect(marks[1]).toHaveAttribute('data-current', 'true');
    expect(marks[0]).not.toHaveAttribute('data-current');

    highlighted.restore();
    expect(runs.map((run) => run.innerHTML)).toEqual(texts);
  });

  it('UIC-PDF-VIEWER-5.1 leaves runs without matches alone', () => {
    const runs = createRuns(['Plum']);
    const highlighted = highlightTextRuns({ runs, texts: ['Plum'], ranges: [] });
    expect(highlighted.current).toBeNull();
    expect(runs[0]?.childNodes).toHaveLength(1);
  });

  it('UIC-PDF-VIEWER-5.1 highlights many matches in one run and restores its text', () => {
    const count = 1_000;
    const text = 'a '.repeat(count);
    const [run] = createRuns([text]);
    expect(run).toBeDefined();
    const highlighted = highlightTextRuns({
      runs: [requireDefined(run)],
      texts: [text],
      ranges: Array.from({ length: count }, (_, index) => ({
        run: 0,
        start: index * 2,
        end: index * 2 + 1,
        isCurrent: index === 500,
      })),
    });
    expect(run?.querySelectorAll('.ui-pdf-viewer__match')).toHaveLength(count);
    expect(run?.textContent).toBe(text);
    expect(highlighted.current).toBe(run?.querySelectorAll('.ui-pdf-viewer__match')[500]);
    expect(highlighted.current).toHaveAttribute('data-current', 'true');
    highlighted.restore();
    expect(run?.textContent).toBe(text);
    expect(run?.childNodes).toHaveLength(1);
  });
});
