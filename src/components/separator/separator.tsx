import { createElement, useId, type JSX, type ReactNode } from 'react';
import {
  Separator as AriaSeparator,
  type SeparatorProps as AriaSeparatorProps,
} from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Orientation } from '../../core/props.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';

/** The line style. */
export type SeparatorVariant = 'solid' | 'dashed' | 'dotted';

/** Where a label sits along the line, in the writing direction. */
export type SeparatorLabelPosition = 'start' | 'center' | 'end';

export interface SeparatorProps extends Omit<AriaSeparatorProps, 'className' | 'style'>, BaseProps {
  /** Line style. Defaults to `solid`. */
  variant?: SeparatorVariant | undefined;
  /** Content drawn across the line, between a start and an end line; it names the separator. */
  label?: ReactNode;
  /** Where the label sits along the line. Defaults to `center`. */
  labelPosition?: SeparatorLabelPosition | undefined;
  /** A purely visual rule (`role="none"`) that assistive technology passes over. */
  decorative?: boolean | undefined;
}

type SeparatorElementProps = JSX.IntrinsicElements['hr' | 'div'];

interface DrawOptions extends Pick<SeparatorProps, 'render' | 'decorative'> {
  element: string;
  parts: ReactNode;
}

const hooks = createHooks('separator', ['start-line', 'label', 'end-line']);

/** React Aria's element: `elementType` or an `<hr>`, which turns into a `<div>` when it cannot hold the rule. */
function resolveElement(
  elementType: AriaSeparatorProps['elementType'],
  { orientation, isLabelled }: { orientation: Orientation; isLabelled: boolean },
): string {
  const element = elementType ?? 'hr';
  return element === 'hr' && (isLabelled || orientation === 'vertical') ? 'div' : element;
}

/**
 * Finishes React Aria's element props: a decorative rule drops the separator role, and a labelled
 * one gains its lines and label. The caller's `render` receives the finished props.
 */
function createDraw({ element, parts, render, decorative }: DrawOptions) {
  return (props: SeparatorElementProps, state: undefined) => {
    const finished: SeparatorElementProps = { ...props };
    if (decorative) {
      finished.role = 'none';
      delete finished['aria-orientation'];
      delete finished['aria-label'];
      delete finished['aria-labelledby'];
    }
    if (parts !== null) finished.children = parts;
    return render ? render(finished, state) : createElement(element, finished);
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
 * A rule between groups of content (React Aria `Separator`), horizontal or vertical, optionally
 * with a label drawn across it that also names it.
 */
export function Separator({
  orientation = 'horizontal',
  variant = 'solid',
  label,
  labelPosition = 'center',
  decorative = false,
  elementType,
  render,
  className,
  ...rest
}: SeparatorProps) {
  const labelId = useId();
  const isLabelled = !isEmptyNode(label);
  const element = resolveElement(elementType, { orientation, isLabelled });
  const isNamedByLabel =
    isLabelled && !decorative && !rest['aria-label'] && !rest['aria-labelledby'];
  const parts = isLabelled ? <SeparatorParts label={label} labelId={labelId} /> : null;
  return (
    <AriaSeparator
      {...rest}
      {...hooks.root({
        className,
        props: rest,
        data: { orientation, variant, labelPosition: isLabelled ? labelPosition : undefined },
      })}
      orientation={orientation}
      elementType={element}
      aria-labelledby={isNamedByLabel ? labelId : rest['aria-labelledby']}
      render={createDraw({ element, parts, render, decorative })}
    />
  );
}
