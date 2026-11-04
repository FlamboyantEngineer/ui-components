'use client';

import { FormulaGlyph } from '../../core/glyphs.js';
import { pickDataAttributes } from '../../core/hooks.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import type { ReactNode } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, ControlSize, RefProps } from '../../core/props.js';
import { formulaBarHooks as hooks } from './formula-bar-hooks.js';

export interface FormulaBarControlsProps
  extends BaseProps, AriaLabellingProps, RefProps<HTMLDivElement> {
  /** The caller's reference and editor controls, which retain their own editing lifecycle. */
  controls: { reference: ReactNode; editor: ReactNode };
  /** Published in data-size. Defaults to md. */
  size?: ControlSize | undefined;
}

/** Caller controls retain their own focus, draft, completion and grid-command lifecycle. */
export function FormulaBarControls({
  controls,
  size = 'md',
  className,
  id,
  ref,
  'aria-label': label,
  'aria-labelledby': labelledBy,
  'aria-describedby': describedBy,
  'aria-details': details,
  ...rest
}: FormulaBarControlsProps) {
  const strings = useUiStrings();
  return (
    <div
      {...pickDataAttributes(rest)}
      {...hooks.root({ className, data: { size, composed: true } })}
      ref={ref}
      id={id}
      role="group"
      aria-label={label ?? (labelledBy ? undefined : strings.formulaBar)}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-details={details}
    >
      <div {...hooks.slot('reference-control')}>{controls.reference}</div>
      <Glyph icon={FormulaGlyph} className={hooks.slotClass('glyph')} />
      <div {...hooks.slot('editor-control')}>{controls.editor}</div>
    </div>
  );
}
