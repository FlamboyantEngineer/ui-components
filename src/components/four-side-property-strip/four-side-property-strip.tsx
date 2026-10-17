import type { ReactNode } from 'react';
import { createHooks, mergeClassNames } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import {
  PropertyRow,
  PropertyStrip,
  PropertyStripCell,
  type PropertyRowProps,
} from '../property-panel/property-panel.js';

/** One side of a box, such as a margin. */
export type BoxSide = 'top' | 'bottom' | 'left' | 'right';

export interface FourSidePropertyStripProps extends Omit<
  PropertyRowProps,
  'children' | 'keywords' | 'htmlFor'
> {
  /** Draws the control of one side. Each control names itself, for example `Margin top`. */
  renderSide: (side: BoxSide) => ReactNode;
}

const sides: readonly BoxSide[] = ['top', 'bottom', 'left', 'right'];

const hooks = createHooks('four-side-property-strip', ['side']);

/**
 * One property row holding a top, bottom, left and right value in that order, such as margins or
 * padding. Each side's cell shows the first letter of the side's name; the names are also words a
 * query matches.
 */
export function FourSidePropertyStrip({
  renderSide,
  className,
  ...rest
}: FourSidePropertyStripProps) {
  const strings = useUiStrings();
  const cells = sides.map((side) => ({ side, name: strings.boxSide(side) }));

  return (
    <PropertyRow
      {...rest}
      className={mergeClassNames(hooks.className, className)}
      keywords={cells.map(({ name }) => name)}
    >
      <PropertyStrip>
        {cells.map(({ side, name }) => (
          <PropertyStripCell
            key={side}
            {...hooks.slot('side', { side })}
            letter={Array.from(name)[0] ?? ''}
            label={name}
          >
            {renderSide(side)}
          </PropertyStripCell>
        ))}
      </PropertyStrip>
    </PropertyRow>
  );
}
