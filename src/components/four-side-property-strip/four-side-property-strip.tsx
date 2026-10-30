import { LinkGlyph } from '../../core/glyphs.js';
import type { ReactNode } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import { createHooks, dataAttributes, mergeClassNames } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import {
  PropertyRow,
  PropertyStrip,
  PropertyStripCell,
  type PropertyRowProps,
} from '../property-panel/property-panel.js';

/** One side of a box, such as a margin. */
export type BoxSide = 'top' | 'bottom' | 'left' | 'right';

/** One side of a box in flow-relative terms, which follow the writing direction. */
export type LogicalBoxSide = 'block-start' | 'block-end' | 'inline-start' | 'inline-end';

/** What linked sides share: one edit sets `all` four sides, or the side and its opposite (`pairs`). */
export type FourSidePropertyStripLink = 'all' | 'pairs';

/** A value for some or all of the sides. */
export type FourSideValues<S extends string, T> = Readonly<Partial<Record<S, T>>>;

/** One side's value and the way to change it, handed to `renderSide`. */
export interface FourSideField<T> {
  /** The side's value, when the strip holds values. */
  value: T | undefined;
  /** Sets the side's value, and the sides linked to it. */
  onChange: (value: T) => void;
}

interface FourSideOptions<S extends string, T> extends Omit<
  PropertyRowProps,
  'children' | 'keywords' | 'htmlFor'
> {
  /** Draws the control of one side. Each control names itself, for example `Margin top`. */
  renderSide: (side: S, field: FourSideField<T>) => ReactNode;
  /** The sides' values, controlled. */
  value?: FourSideValues<S, T> | undefined;
  /** The sides' values to start from, uncontrolled. */
  defaultValue?: FourSideValues<S, T> | undefined;
  /** Called with every side's value when one changes. */
  onChange?: ((value: FourSideValues<S, T>) => void) | undefined;
  /** Offers a toggle that links the sides, so one edit sets all four or each opposite pair. */
  link?: FourSidePropertyStripLink | undefined;
  /** Whether the sides are linked, controlled. */
  isLinked?: boolean | undefined;
  /** Whether the sides start linked, uncontrolled. */
  defaultLinked?: boolean | undefined;
  /** Called when the reader links or unlinks the sides. */
  onLinkedChange?: ((isLinked: boolean) => void) | undefined;
}

export type FourSidePropertyStripProps<T = string> =
  | (FourSideOptions<BoxSide, T> & {
      /** `physical` (the default) edits top, bottom, left and right. */
      sides?: 'physical' | undefined;
    })
  | (FourSideOptions<LogicalBoxSide, T> & {
      /** `logical` edits block start and end, then inline start and end, which follow the direction. */
      sides: 'logical';
    });

const physicalSides: readonly BoxSide[] = ['top', 'bottom', 'left', 'right'];
const logicalSides: readonly LogicalBoxSide[] = [
  'block-start',
  'block-end',
  'inline-start',
  'inline-end',
];

const hooks = createHooks('four-side-property-strip', ['side', 'link']);

/** The side across the box from `index`: sides come in opposite pairs, in order. */
function opposite<S>(sides: readonly S[], index: number): S | undefined {
  return sides[index % 2 === 0 ? index + 1 : index - 1];
}

/** The values after `side` takes `value`, with the sides linked to it. */
function setSide<S extends string, T>(
  values: FourSideValues<S, T>,
  { sides, side, value }: { sides: readonly S[]; side: S; value: T },
  link: FourSidePropertyStripLink | null,
): FourSideValues<S, T> {
  const index = sides.indexOf(side);
  const pair = opposite(sides, index);
  const linked = link === 'all' ? sides : link === 'pairs' && pair ? [side, pair] : [side];
  const next: Partial<Record<S, T>> = { ...values };
  for (const each of linked) next[each] = value;
  return next;
}

/**
 * One property row holding a value for each side of a box, such as margins or padding: top,
 * bottom, left and right, or their flow-relative counterparts. Each side's cell shows the first
 * letter of the side's name; the names are also words a query matches. Holding the values, the
 * strip can link its sides so that one edit sets all four or each opposite pair.
 */
export function FourSidePropertyStrip<T = string>(props: FourSidePropertyStripProps<T>) {
  const { sides: mode, renderSide, value, defaultValue, onChange, className, ...row } = props;
  const { link, isLinked, defaultLinked, onLinkedChange, ...rest } = row;
  const strings = useUiStrings();
  const [values, setValues] = useControllableState<FourSideValues<string, T>>(
    value,
    defaultValue ?? {},
    onChange as ((next: FourSideValues<string, T>) => void) | undefined,
  );
  const [linked, setLinked] = useControllableState(
    isLinked,
    defaultLinked ?? false,
    onLinkedChange,
  );
  const sides: readonly string[] = mode === 'logical' ? logicalSides : physicalSides;
  const nameOf = (side: string) =>
    mode === 'logical'
      ? strings.logicalBoxSide(side as LogicalBoxSide)
      : strings.boxSide(side as BoxSide);
  const draw = renderSide as (side: string, field: FourSideField<T>) => ReactNode;
  const activeLink = link && linked ? link : null;

  return (
    <PropertyRow
      {...rest}
      {...dataAttributes({ linked: activeLink !== null })}
      className={mergeClassNames(hooks.className, className)}
      keywords={sides.map(nameOf)}
    >
      <PropertyStrip>
        {sides.map((side) => {
          const name = nameOf(side);
          const field: FourSideField<T> = {
            value: values[side],
            onChange: (next) =>
              setValues(setSide(values, { sides, side, value: next }, activeLink)),
          };
          return (
            <PropertyStripCell
              key={side}
              {...hooks.slot('side', { side })}
              letter={Array.from(name)[0] ?? ''}
              label={name}
            >
              {draw(side, field)}
            </PropertyStripCell>
          );
        })}
        {link ? (
          <Button
            className={hooks.slotClass('link')}
            icon={LinkGlyph}
            size="sm"
            label={strings.linkSides(link)}
            isSelected={linked}
            onChange={setLinked}
          />
        ) : null}
      </PropertyStrip>
    </PropertyRow>
  );
}
