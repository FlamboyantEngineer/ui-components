'use client';

import { FormulaGlyph } from '../../core/glyphs.js';
import { pickDataAttributes } from '../../core/hooks.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import type { FormulaBarProps } from './formula-bar.js';
import { formulaBarHooks as hooks } from './formula-bar-hooks.js';

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
}: FormulaBarProps) {
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
      <div {...hooks.slot('reference-control')}>{controls?.reference}</div>
      <Glyph icon={FormulaGlyph} className={hooks.slotClass('glyph')} />
      <div {...hooks.slot('editor-control')}>{controls?.editor}</div>
    </div>
  );
}
