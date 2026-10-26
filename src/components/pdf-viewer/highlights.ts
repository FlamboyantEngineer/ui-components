import { pdfViewerHooks } from './styling-hooks.js';
import type { PdfMatchRange } from './pdf-search.js';

interface HighlightTextRunsOptions {
  /** The text layer's run elements. */
  runs: readonly HTMLElement[];
  /** Each run's original text. */
  texts: readonly string[];
  ranges: readonly PdfMatchRange[];
}

interface HighlightedTextRuns {
  /** The element of the current match, when this layer holds it. */
  current: HTMLElement | null;
  /** Puts every touched run back to its original text. */
  restore(): void;
}

function groupByRun(ranges: readonly PdfMatchRange[]): Map<number, PdfMatchRange[]> {
  const groups = new Map<number, PdfMatchRange[]>();
  for (const range of ranges) {
    const group = groups.get(range.run) ?? [];
    group.push(range);
    groups.set(range.run, group);
  }
  return groups;
}

function markRun(run: HTMLElement, text: string, ranges: readonly PdfMatchRange[]) {
  const nodes = document.createDocumentFragment();
  let current: HTMLElement | null = null;
  let offset = 0;
  for (const range of ranges) {
    nodes.append(document.createTextNode(text.slice(offset, range.start)));
    const mark = document.createElement('span');
    mark.className = pdfViewerHooks.slotClass('match');
    mark.textContent = text.slice(range.start, range.end);
    if (range.isCurrent) {
      mark.dataset.current = 'true';
      current ??= mark;
    }
    nodes.append(mark);
    offset = range.end;
  }
  nodes.append(document.createTextNode(text.slice(offset)));
  run.replaceChildren(nodes);
  return current;
}

/**
 * Wraps each match in the text layer's runs in a `ui-pdf-viewer__match` element, the current one marked with
 * `data-current`. The runs belong to the engine, so they are rewritten in place and restored after.
 */
export function highlightTextRuns({
  runs,
  texts,
  ranges,
}: HighlightTextRunsOptions): HighlightedTextRuns {
  const groups = groupByRun(ranges);
  let current: HTMLElement | null = null;
  for (const [index, runRanges] of groups) {
    const run = runs[index];
    const text = texts[index];
    if (run && text !== undefined) current = markRun(run, text, runRanges) ?? current;
  }
  return {
    current,
    restore() {
      for (const index of groups.keys()) {
        const run = runs[index];
        if (run) run.textContent = texts[index] ?? '';
      }
    },
  };
}
