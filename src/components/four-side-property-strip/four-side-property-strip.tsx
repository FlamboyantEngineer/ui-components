'use client';

import { LinkGlyph } from '../../core/glyphs.js';
import { useLayoutEffect, useRef, type ReactNode } from 'react';
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

/** An opposite pair of sides: `vertical` is top and bottom, `horizontal` left and right. */
export type BoxAxis = 'vertical' | 'horizontal';

/** An opposite pair of flow-relative sides: `block` is block start and end, `inline` their inline pair. */
export type LogicalBoxAxis = 'block' | 'inline';

/** What linked sides share: one edit sets `all` four sides, or the side and its opposite (`pairs`). */
export type FourSidePropertyStripLink = 'all' | 'pairs';

/** Where the side controls' values sit in their boxes. */
export type FourSideValueAlign = 'start' | 'center' | 'end';

/** A value for some or all of the sides. */
export type FourSideValues<S extends string, T> = Readonly<Partial<Record<S, T>>>;

/** One side's value and the way to change it, handed to `renderSide`. */
export interface FourSideField<T> {
  /** The side's value, when the strip holds values. */
  value: T | undefined;
  /** Sets the side's value, and the sides linked to it. */
  onChange: (value: T) => void;
}

interface FourSideOptions<S extends string, A extends string, T> extends Omit<
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
  /**
   * Where each side control's value sits in its box, published for the stylesheet: `start`,
   * `center` or `end`, in the reading direction. Without it, the controls keep their own alignment.
   */
  valueAlign?: FourSideValueAlign | undefined;
  /**
   * Offers toggles that link the sides: one for all four, or one for each opposite pair, so one
   * edit sets all four or the side and its opposite.
   */
  link?: FourSidePropertyStripLink | undefined;
  /**
   * The linked pairs, controlled: each pair listed links its two sides, and with `link="all"` the
   * four sides are linked while both pairs are.
   */
  linked?: readonly A[] | undefined;
  /** The pairs linked to start with, uncontrolled. */
  defaultLinked?: readonly A[] | undefined;
  /** Called with the linked pairs when the reader links or unlinks some. */
  onLinkedChange?: ((linked: readonly A[]) => void) | undefined;
}

export type FourSidePropertyStripProps<T = string> =
  | (FourSideOptions<BoxSide, BoxAxis, T> & {
      /** `physical` (the default) edits top, bottom, left and right. */
      sides?: 'physical' | undefined;
    })
  | (FourSideOptions<LogicalBoxSide, LogicalBoxAxis, T> & {
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

const noAxes: readonly string[] = [];
const physicalAxes: readonly BoxAxis[] = ['vertical', 'horizontal'];
const logicalAxes: readonly LogicalBoxAxis[] = ['block', 'inline'];

const hooks = createHooks('four-side-property-strip', ['side', 'bracket', 'link']);

/** Sides one toggle links, drawn as a bracket below their cells: all four, or an opposite pair. */
interface LinkGroup {
  /** `all`, or the pair's axis. */
  key: string;
  sides: readonly string[];
  /** The pairs the group links. */
  axes: readonly string[];
}

/** The groups `link` offers: sides come in opposite pairs, in order, one pair per axis. */
function linkGroups(
  sides: readonly string[],
  axes: readonly string[],
  link: FourSidePropertyStripLink,
): LinkGroup[] {
  if (link === 'all') return [{ key: 'all', sides, axes }];
  return axes.map((axis, index) => ({
    key: axis,
    sides: sides.slice(index * 2, index * 2 + 2),
    axes: [axis],
  }));
}

/** Whether every pair `group` links is linked. */
function isGroupLinked(group: LinkGroup, linked: readonly string[]): boolean {
  return group.axes.every((axis) => linked.includes(axis));
}

/** The values after `side` takes `value`, with the sides of its linked group. */
function setSide<T>(
  values: FourSideValues<string, T>,
  { side, value }: { side: string; value: T },
  groups: readonly LinkGroup[],
): FourSideValues<string, T> {
  const group = groups.find((each) => each.sides.includes(side));
  const next: Partial<Record<string, T>> = { ...values };
  for (const each of group?.sides ?? [side]) next[each] = value;
  return next;
}

/**
 * Applies edits to `values` through `setValues`, each built on the edits made before the strip
 * renders again rather than on the values shown, so edits in one batch keep each other. Every
 * commit drops them, so an edit a controlling owner did not accept is not carried on.
 */
function useBatchedEdits<V>(values: V, setValues: (next: V) => void) {
  const unrendered = useRef<{ values: V } | null>(null);
  useLayoutEffect(() => {
    unrendered.current = null;
  });
  return (update: (base: V) => V) => {
    const next = update(unrendered.current ? unrendered.current.values : values);
    unrendered.current = { values: next };
    setValues(next);
  };
}

/**
 * A bracket below each group of sides a toggle links, its ends at the group's outer cells and its
 * own toggle at its centre, named after the sides it links.
 */
function LinkBrackets({
  groups,
  axes,
  linked,
  onLinkedChange,
}: {
  groups: readonly LinkGroup[];
  axes: readonly string[];
  linked: readonly string[];
  onLinkedChange: (linked: readonly string[]) => void;
}) {
  const strings = useUiStrings();
  const toggle = (group: LinkGroup, isLinked: boolean) => {
    const rest = linked.filter((axis) => !group.axes.includes(axis));
    const next = isLinked ? [...rest, ...group.axes] : rest;
    onLinkedChange(axes.filter((axis) => next.includes(axis)));
  };
  return groups.map((group) => {
    const isLinked = isGroupLinked(group, linked);
    return (
      <span
        key={group.key}
        {...hooks.slot('bracket', { sides: group.sides.join(' '), linked: isLinked })}
      >
        <Button
          className={hooks.slotClass('link')}
          icon={LinkGlyph}
          size="sm"
          label={strings.linkSides(group.key as 'all' | BoxAxis | LogicalBoxAxis)}
          isSelected={isLinked}
          onChange={(next) => toggle(group, next)}
        />
      </span>
    );
  });
}

/**
 * One property row holding a value for each side of a box, such as margins or padding: top,
 * bottom, left and right, or their flow-relative counterparts. Each side's cell shows the first
 * letter of the side's name; the names are also words a query matches. Holding the values, the
 * strip can link its sides so that one edit sets all four or each opposite pair.
 */
export function FourSidePropertyStrip<T = string>(props: FourSidePropertyStripProps<T>) {
  const { sides: mode, renderSide, value, defaultValue, onChange, className, ...row } = props;
  const { link, linked: linkedProp, defaultLinked, onLinkedChange, valueAlign, ...rest } = row;
  const strings = useUiStrings();
  const [values, setValues] = useControllableState<FourSideValues<string, T>>(
    value,
    defaultValue ?? {},
    onChange as ((next: FourSideValues<string, T>) => void) | undefined,
  );
  const [linked, setLinked] = useControllableState<readonly string[]>(
    linkedProp,
    defaultLinked ?? noAxes,
    onLinkedChange as ((next: readonly string[]) => void) | undefined,
  );
  const sides: readonly string[] = mode === 'logical' ? logicalSides : physicalSides;
  const axes: readonly string[] = mode === 'logical' ? logicalAxes : physicalAxes;
  const groups = link ? linkGroups(sides, axes, link) : [];
  const linkedGroups = groups.filter((group) => isGroupLinked(group, linked));
  const nameOf = (side: string) =>
    mode === 'logical'
      ? strings.logicalBoxSide(side as LogicalBoxSide)
      : strings.boxSide(side as BoxSide);
  const edit = useBatchedEdits(values, setValues);
  const draw = renderSide as (side: string, field: FourSideField<T>) => ReactNode;

  return (
    <PropertyRow
      {...rest}
      {...dataAttributes({ link, valueAlign })}
      className={mergeClassNames(hooks.className, className)}
      keywords={sides.map(nameOf)}
    >
      <PropertyStrip>
        {sides.map((side) => {
          const name = nameOf(side);
          const field: FourSideField<T> = {
            value: values[side],
            onChange: (next) => edit((base) => setSide(base, { side, value: next }, linkedGroups)),
          };
          const isLinked = linkedGroups.some((group) => group.sides.includes(side));
          return (
            <PropertyStripCell
              key={side}
              {...hooks.slot('side', { side, linked: isLinked })}
              letter={Array.from(name)[0] ?? ''}
              label={name}
            >
              {draw(side, field)}
            </PropertyStripCell>
          );
        })}
        <LinkBrackets groups={groups} axes={axes} linked={linked} onLinkedChange={setLinked} />
      </PropertyStrip>
    </PropertyRow>
  );
}
