import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { Popover } from '../../primitives/index.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { useLayerZIndex } from '../portal/portal.js';
import { findOffsetAt, measureRange, readCopyText, type CopyText } from './code-geometry.js';
import { codeEditorHooks as hooks, type CodeDiagnostic } from './code-layers.js';
import type { CodeRange } from './code-ranges.js';
import type { CodeSegment } from './code-segments.js';

/** A diagnostic and the source it marks. */
export interface MarkedDiagnostic {
  diagnostic: CodeDiagnostic;
  range: CodeRange;
}

interface CodeHoverOptions {
  inputRef: RefObject<HTMLTextAreaElement | null>;
  highlightRef: RefObject<HTMLPreElement | null>;
  marked: readonly MarkedDiagnostic[];
  renderHover: ((offset: number) => ReactNode) | undefined;
  /** What the highlighted copy draws; its text is read again only after it changes. */
  segments: readonly (CodeSegment | null)[];
}

/** The copy's text as last read, and the render it was read from. */
interface ReadCopy {
  highlight: HTMLElement;
  segments: readonly (CodeSegment | null)[];
  text: CopyText;
}

/** What the tooltip shows, and the on-screen rectangle it points at. */
interface CodeHoverTip {
  offset: number;
  rect: DOMRect;
  diagnostics: CodeDiagnostic[];
  info: ReactNode;
}

export interface CodeHoverModel {
  tip: CodeHoverTip | null;
  /** Shows the tip of a range the keyboard moved to. */
  showAt(range: CodeRange): void;
  onPointerMove(event: PointerEvent<HTMLTextAreaElement>): void;
  /** Hides the tip shortly, unless the pointer moves into it. */
  onPointerLeave(): void;
  /** Keeps the tip open while the pointer is over it. */
  hold(): void;
  close(): void;
}

interface CodeHoverTooltipProps {
  model: CodeHoverModel;
  inputRef: RefObject<HTMLTextAreaElement | null>;
}

/** How long the tip stays after the pointer leaves, so the pointer can move into it. */
const LEAVE_DELAY = 200;

function diagnosticsAt(marked: readonly MarkedDiagnostic[], offset: number) {
  return marked
    .filter(({ range }) => offset >= range.start && offset < range.end)
    .map(({ diagnostic }) => diagnostic);
}

/**
 * The hover tip of a code editor: the problems marked under the pointer and the caller's hover
 * information for that offset, read from the highlighted copy under the text area.
 */
export function useCodeHover({
  inputRef,
  highlightRef,
  marked,
  renderHover,
  segments,
}: CodeHoverOptions): CodeHoverModel {
  const [tip, setTip] = useState<CodeHoverTip | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copy = useRef<ReadCopy | null>(null);
  // Pointer moves read the copy's text nodes from the last render instead of walking it each time.
  const readCopy = (highlight: HTMLElement): CopyText => {
    const last = copy.current;
    if (last?.highlight === highlight && last.segments === segments) return last.text;
    copy.current = { highlight, segments, text: readCopyText(highlight) };
    return copy.current.text;
  };
  const hold = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);
  const close = useCallback(() => {
    hold();
    setTip(null);
  }, [hold]);
  useEffect(() => hold, [hold]);

  const tipAt = (offset: number, range: CodeRange): CodeHoverTip | null => {
    const highlight = highlightRef.current;
    const rect = highlight ? measureRange(readCopy(highlight), range) : null;
    const diagnostics = diagnosticsAt(marked, offset);
    const info = renderHover?.(offset);
    if (!rect || (diagnostics.length === 0 && isEmptyNode(info))) return null;
    return { offset, rect, diagnostics, info };
  };

  const onPointerLeave = () => {
    hold();
    timer.current = setTimeout(() => setTip(null), LEAVE_DELAY);
  };
  return {
    tip,
    showAt: (range) => setTip(tipAt(range.start, range)),
    onPointerMove(event) {
      const highlight = highlightRef.current;
      if (!highlight || event.buttons !== 0 || inputRef.current === null) return;
      const offset = findOffsetAt(readCopy(highlight), event.clientX, event.clientY);
      if (offset !== null && offset === tip?.offset) return hold();
      const next = offset === null ? null : tipAt(offset, { start: offset, end: offset + 1 });
      if (next) {
        hold();
        setTip(next);
      } else if (tip && !timer.current) onPointerLeave();
    },
    onPointerLeave,
    hold,
    close,
  };
}

/** The hover tip: a non-modal popover on the tooltip layer, pointing at the hovered text. */
export function CodeHoverTooltip({ model, inputRef }: CodeHoverTooltipProps) {
  const zIndex = useLayerZIndex('tooltip');
  const { tip } = model;
  return (
    <Popover
      className={hooks.slotClass('tooltip')}
      isOpen={tip !== null}
      onOpenChange={(open) => (open ? undefined : model.close())}
      isNonModal
      triggerRef={inputRef}
      getTargetRect={() => tip?.rect}
      placement="top start"
      offset={4}
      style={{ zIndex }}
      onPointerEnter={model.hold}
      onPointerLeave={model.onPointerLeave}
    >
      <div role="tooltip">
        {tip?.diagnostics.map((diagnostic, index) => (
          <div
            key={index}
            {...hooks.slot('diagnostic', { severity: diagnostic.severity ?? 'error' })}
          >
            {diagnostic.message}
          </div>
        ))}
        {tip?.info}
      </div>
    </Popover>
  );
}
