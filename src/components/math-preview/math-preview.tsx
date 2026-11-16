'use client';

import { type ReactNode, useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { BaseProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { isOverflowing } from '../../utils/is-overflowing.js';
import { useResizeObserver } from '../../utils/use-resize-observer.js';
import { renderKatexMath } from './katex-renderer.js';
import { mathPreviewHooks as hooks } from './math-preview-hooks.js';
import {
  DEFAULT_MATH_MAX_LENGTH,
  type MathDisplay,
  type MathPreviewState,
  type MathRenderer,
  useMathRender,
} from './math-render.js';

export interface MathPreviewProps extends RefProps<HTMLSpanElement>, BaseProps {
  /** The LaTeX source to typeset. */
  source: string;
  /** `inline` (the default) sits in a line of text; `display` stands on its own line. */
  display?: MathDisplay | undefined;
  /** Typesets the source to MathML. Defaults to KaTeX, loaded the first time it is needed. */
  renderer?: MathRenderer | undefined;
  /** The longest source typeset, in characters. Defaults to 10000. */
  maxLength?: number | undefined;
}

/**
 * The typeset math. Math wider than its box scrolls inside it (in the reference sheet), so while it
 * does the box takes keyboard focus and publishes `data-overflowing`: the reader can scroll it with
 * the arrow keys.
 */
function MathSlot({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [isCut, setCut] = useState(false);
  const measure = useCallback(() => {
    setCut(ref.current !== null && isOverflowing(ref.current, 'horizontal'));
  }, []);
  useResizeObserver([ref], measure);
  useLayoutEffect(measure, [measure, children]);
  return (
    <span
      ref={ref}
      {...hooks.slot('math', { overflowing: isCut })}
      tabIndex={isCut ? 0 : undefined}
    >
      {children}
    </span>
  );
}

/** The typeset math, or what stands in for it: typesetting, or why the source does not typeset. */
export function MathPreviewContent({
  preview,
  source,
  maxLength,
}: {
  preview: MathPreviewState;
  source: string;
  maxLength: number;
}) {
  const strings = useUiStrings();
  if (preview.status === 'invalid') {
    return (
      <>
        <span {...hooks.slot('error')}>
          {preview.isTooLong ? strings.mathTooLong(maxLength) : strings.mathInvalid}
        </span>{' '}
        {preview.isTooLong ? null : (
          <>
            <span {...hooks.slot('detail')}>{preview.message}</span>{' '}
          </>
        )}
        <code {...hooks.slot('source')}>{source}</code>
      </>
    );
  }
  if (preview.math !== null) return <MathSlot>{preview.math}</MathSlot>;
  if (preview.status === 'pending') {
    return <span {...hooks.slot('pending')}>{strings.mathPending}</span>;
  }
  return null;
}

/**
 * LaTeX source typeset as MathML. The renderer's markup goes through an allow-list of MathML
 * elements and attributes, so untrusted source never reaches the page as HTML. The latest source
 * wins: older answers are dropped, and the last math stays shown, marked stale, while newer source
 * typesets.
 */
export function MathPreview({
  ref,
  source,
  display = 'inline',
  renderer = renderKatexMath,
  maxLength = DEFAULT_MATH_MAX_LENGTH,
  className,
  ...rest
}: MathPreviewProps) {
  const preview = useMathRender({ source, display, renderer, maxLength });
  return (
    <span
      ref={ref}
      {...rest}
      {...hooks.root({
        className,
        props: rest,
        data: { display, status: preview.status, stale: preview.isStale },
      })}
    >
      <MathPreviewContent preview={preview} source={source} maxLength={maxLength} />
    </span>
  );
}
