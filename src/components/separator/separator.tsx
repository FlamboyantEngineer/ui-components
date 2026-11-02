'use client';

import { createElement, useId, type JSX, type ReactNode } from 'react';
import { Separator as AriaSeparator } from '../../primitives/index.js';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Orientation, RefProps } from '../../core/props.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import type { ElementRender } from '../../utils/render-element.js';

/** The line style. */
export type SeparatorVariant = 'solid' | 'dashed' | 'dotted' | 'wiggly';

/** Where a label sits along the line, in the writing direction. */
export type SeparatorLabelPosition = 'start' | 'center' | 'end';

/**
 * Where a label sits relative to the line: `across` it, between a start and an end line, or
 * `before` or `after` an unbroken line (above or below a horizontal one; at its inline start or
 * end beside a vertical one).
 */
export type SeparatorLabelPlacement = 'across' | 'before' | 'after';

/** The element a separator renders when it can hold an `<hr>`'s rule. */
export type SeparatorElement = 'hr' | 'div' | 'li';

/** The state a separator passes to `render` with its element's props. */
export interface SeparatorRenderState {
  orientation: Orientation;
}

export interface SeparatorProps
  extends
    BaseProps,
    RefProps<HTMLElement>,
    Pick<AriaLabellingProps, 'aria-label' | 'aria-labelledby'> {
  /** `horizontal` (the default) separates blocks; `vertical` separates inline items. */
  orientation?: Orientation | undefined;
  /** The element for an unlabelled horizontal rule. Defaults to `hr`; otherwise a `<div>`. */
  as?: SeparatorElement | undefined;
  /** Line style. Defaults to `solid`. */
  variant?: SeparatorVariant | undefined;
  /** Content drawn across the line, between a start and an end line; it names the separator. */
  label?: ReactNode;
  /** Where the label sits along the line. Defaults to `center`. */
  labelPosition?: SeparatorLabelPosition | undefined;
  /** Where the label sits relative to the line. Defaults to `across`. */
  labelPlacement?: SeparatorLabelPlacement | undefined;
  /** A purely visual rule (`role="none"`) that assistive technology passes over. */
  decorative?: boolean | undefined;
  /**
   * Replaces the separator's element with the caller's own of the same type, given its finished
   * props and state.
   */
  render?: ElementRender<'div', SeparatorRenderState> | undefined;
}

type SeparatorElementProps = JSX.IntrinsicElements['hr' | 'div'];

interface DrawOptions extends Pick<SeparatorProps, 'render' | 'decorative'> {
  element: string;
  parts: ReactNode;
  orientation: Orientation;
}

const hooks = createHooks('separator', ['start-line', 'label', 'end-line']);

/** `as` or an `<hr>`, which turns into a `<div>` when it cannot hold the rule. */
function resolveElement(
  as: SeparatorElement | undefined,
  { orientation, isLabelled }: { orientation: Orientation; isLabelled: boolean },
): string {
  const element = as ?? 'hr';
  return element === 'hr' && (isLabelled || orientation === 'vertical') ? 'div' : element;
}

/**
 * Finishes the building block's element props: a decorative rule drops the separator role, and a
 * labelled one gains its lines and label. The caller's `render` receives the finished props.
 */
function createDraw({ element, parts, render, decorative, orientation }: DrawOptions) {
  return (props: SeparatorElementProps) => {
    const finished: SeparatorElementProps = { ...props };
    if (decorative) {
      finished.role = 'none';
      delete finished['aria-orientation'];
      delete finished['aria-label'];
      delete finished['aria-labelledby'];
    }
    if (parts !== null) finished.children = parts;
    return render
      ? render(finished as JSX.IntrinsicElements['div'], { orientation })
      : createElement(element, finished);
  };
}

/** The lines on both sides of a label, hidden from assistive technology. */
function SeparatorParts({ label, labelId }: { label: ReactNode; labelId: string }) {
  return (
    <>
      <span {...hooks.slot('start-line')} aria-hidden="true" />
      <span {...hooks.slot('label')} id={labelId}>
        {label}
      </span>
      <span {...hooks.slot('end-line')} aria-hidden="true" />
    </>
  );
}

/**
 * A rule between groups of content, horizontal or vertical, optionally
 * with a label drawn across it that also names it.
 */
export function Separator({
  orientation = 'horizontal',
  variant = 'solid',
  label,
  labelPosition = 'center',
  labelPlacement = 'across',
  decorative = false,
  as,
  render,
  className,
  ...rest
}: SeparatorProps) {
  const labelId = useId();
  const isLabelled = !isEmptyNode(label);
  const element = resolveElement(as, { orientation, isLabelled });
  const isNamedByLabel =
    isLabelled && !decorative && !rest['aria-label'] && !rest['aria-labelledby'];
  const parts = isLabelled ? <SeparatorParts label={label} labelId={labelId} /> : null;
  return (
    <AriaSeparator
      {...rest}
      {...hooks.root({
        className,
        props: rest,
        data: {
          orientation,
          variant,
          labelPosition: isLabelled ? labelPosition : undefined,
          labelPlacement: isLabelled ? labelPlacement : undefined,
        },
      })}
      orientation={orientation}
      elementType={element}
      aria-labelledby={isNamedByLabel ? labelId : rest['aria-labelledby']}
      render={createDraw({ element, parts, render, decorative, orientation })}
    />
  );
}
