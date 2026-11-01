'use client';

import { ChevronDoubleLeftGlyph, ChevronDoubleRightGlyph } from '../../core/glyphs.js';
import { useId, useMemo, useRef, type ReactNode, type RefObject } from 'react';
import { FocusScope, useFocusManager, useLocale } from '../../primitives/index.js';
import type { AriaLabellingProps } from '../../core/events.js';
import { measuredProperty } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStorage, useUiStrings } from '../../core/provider.js';
import { booleanCodec, numberCodec } from '../../utils/json-codec.js';
import { useOwnedPreview } from '../../utils/use-owned-preview.js';
import { usePersistedValue } from '../../utils/use-persisted-value.js';
import { useShallowStable } from '../../utils/use-shallow-stable.js';
import { clamp } from '../../utils/clamp.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { isEditableTarget } from '../../utils/is-editable-target.js';
import { isHTMLElement } from '../../utils/is-element.js';
import {
  closestHiddenSubtree,
  isHiddenOrGone,
  useFocusRecovery,
} from '../../utils/use-focus-recovery.js';
import { Button } from '../button/button.js';
import { ResizeHandle } from '../split-view/split-view.js';
import { NavigationRailContext, navigationRailHooks as hooks } from './navigation-rail-state.js';

export interface NavigationRailProps extends BaseProps, AriaLabellingProps {
  /** The `NavigationRailSection`s. */
  children?: ReactNode;
  /** Content above the sections, such as a product link; the collapse button follows it. */
  header?: ReactNode;
  /** Content below the sections, such as the signed-in person. */
  footer?: ReactNode;
  /** Whether the rail shows icons only (controlled). */
  isCollapsed?: boolean | undefined;
  /** Whether the rail starts collapsed when uncontrolled. Defaults to false. */
  defaultCollapsed?: boolean | undefined;
  /** Called when the rail collapses or expands. */
  onCollapsedChange?: ((isCollapsed: boolean) => void) | undefined;
  /** Draws a handle at the inline end that resizes the expanded rail. */
  isResizable?: boolean | undefined;
  /** The expanded width in pixels (controlled). */
  width?: number | undefined;
  /** The expanded width in pixels when uncontrolled. Defaults to 240. */
  defaultWidth?: number | undefined;
  /** Called with the new width when a drag ends or after a key step. */
  onWidthChange?: ((width: number) => void) | undefined;
  /** The smallest width a resize reaches. Defaults to 180. */
  minWidth?: number | undefined;
  /** The largest width a resize reaches. Defaults to 400. */
  maxWidth?: number | undefined;
  /** Keeps the uncontrolled collapsed state and width in the provider storage under this key. */
  persistKey?: string | undefined;
}

const linkSelector = `.${hooks.slotClass('link')}, .${hooks.slotClass('group-trigger')}`;

const bodyKeys: Readonly<
  Record<string, 'focusNext' | 'focusPrevious' | 'focusFirst' | 'focusLast'>
> = {
  ArrowDown: 'focusNext',
  ArrowUp: 'focusPrevious',
  Home: 'focusFirst',
  End: 'focusLast',
};

interface RailBodyProps {
  id: string;
  children: ReactNode;
}

/** The scrolling list of sections. Up and Down, Home and End move focus between its entries. */
function RailBody({ id, children }: RailBodyProps) {
  const focusManager = useFocusManager();
  return (
    <div
      {...hooks.slot('body')}
      id={id}
      onKeyDown={(event) => {
        const move = bodyKeys[event.key];
        if (!move || !focusManager || event.defaultPrevented) return;
        // A field a host places in a section keeps its caret keys.
        if (isEditableTarget(event.target)) return;
        event.preventDefault();
        focusManager[move]({ accept: (node) => node.matches(linkSelector) });
      }}
    >
      {children}
    </div>
  );
}

interface RailResizeProps {
  width: number;
  minWidth: number;
  maxWidth: number;
  onResize: (width: number | null) => void;
  onResizeEnd: (width: number) => void;
  /** Changes with the persist key, storage or bounds; a drag begun for another owner is dropped. */
  owner: object;
}

/** The handle that resizes the expanded rail: live while dragging, committed when the drag ends. */
function RailResizeHandle({
  width,
  minWidth,
  maxWidth,
  onResize,
  onResizeEnd,
  owner,
}: RailResizeProps) {
  const strings = useUiStrings();
  return (
    <ResizeHandle
      className={hooks.slotClass('resize-handle')}
      aria-label={strings.resizeNavigation}
      orientation="vertical"
      value={width}
      minValue={minWidth}
      maxValue={maxWidth}
      extent={maxWidth}
      resetKey={owner}
      onChange={onResize}
      onChangeCancel={() => onResize(null)}
      onChangeEnd={(next) => {
        onResize(null);
        onResizeEnd(next);
      }}
    />
  );
}

interface RailToggleProps {
  isCollapsed: boolean;
  bodyId: string;
  onPress: () => void;
}

/** The button that collapses the rail, pointing to the inline start, or expands it again. */
function RailToggle({ isCollapsed, bodyId, onPress }: RailToggleProps) {
  const strings = useUiStrings();
  const { direction } = useLocale();
  const label = strings.toggleNavigation(isCollapsed);
  const pointsLeft = isCollapsed === (direction === 'rtl');
  return (
    <Button
      className={hooks.slotClass('toggle')}
      icon={pointsLeft ? ChevronDoubleLeftGlyph : ChevronDoubleRightGlyph}
      label={label}
      tooltip={label}
      size="sm"
      aria-expanded={!isCollapsed}
      aria-controls={bodyId}
      onPress={onPress}
    />
  );
}

/**
 * Keeps focus in the rail when a group closes over the item holding it (also by the rail
 * collapsing, which closes every group): focus moves to the trigger of the closed group, the
 * outermost one shown when groups nest, else to the rail's collapse button.
 */
function useRailFocusRecovery(rootRef: RefObject<HTMLElement | null>) {
  useFocusRecovery(rootRef, (lost) => {
    let target: Element | null | undefined = lost;
    while (target && isHiddenOrGone(target)) {
      const group: Element | null | undefined = closestHiddenSubtree(target)?.closest(
        `.${hooks.slotClass('group')}`,
      );
      target = group?.querySelector(`.${hooks.slotClass('group-trigger')}`);
    }
    const toggle = rootRef.current?.querySelector(`.${hooks.slotClass('toggle')}`);
    return isHTMLElement(target) ? target : isHTMLElement(toggle) ? toggle : null;
  });
}

/**
 * The side navigation of an application (a `navigation` landmark): a header with a collapse
 * button, sections of links and groups, and a footer. Collapsed, it shows icons with tooltips; it
 * can be resized, and its collapsed state and width persist through the provider storage.
 */
export function NavigationRail({
  children,
  header,
  footer,
  isCollapsed: collapsedProp,
  defaultCollapsed = false,
  onCollapsedChange,
  isResizable = false,
  width: widthProp,
  defaultWidth = 240,
  onWidthChange,
  minWidth = 180,
  maxWidth = 400,
  persistKey,
  className,
  ...rest
}: NavigationRailProps) {
  const bodyId = `${useId()}-body`;
  const rootRef = useRef<HTMLElement>(null);
  useRailFocusRecovery(rootRef);
  const [isCollapsed, setCollapsed] = usePersistedValue({
    value: collapsedProp,
    defaultValue: defaultCollapsed,
    onChange: onCollapsedChange,
    persistKey: persistKey === undefined ? undefined : `${persistKey}:collapsed`,
    codec: booleanCodec,
  });
  const [committedWidth, setWidth] = usePersistedValue({
    value: widthProp,
    defaultValue: defaultWidth,
    onChange: onWidthChange,
    persistKey: persistKey === undefined ? undefined : `${persistKey}:width`,
    codec: numberCodec,
  });
  // A drag or preview begun under another key, storage or bounds is dropped, never committed.
  const owner = useShallowStable({ persistKey, storage: useUiStorage(), minWidth, maxWidth });
  const [liveWidth, setLiveWidth] = useOwnedPreview<number>(owner);
  // A stored or controlled width outside the bounds is drawn at the nearest bound.
  const width = clamp(liveWidth ?? committedWidth, minWidth, maxWidth);
  const state = useMemo(
    () => ({ isCollapsed, expand: () => setCollapsed(false) }),
    [isCollapsed, setCollapsed],
  );
  const style = isResizable ? measuredProperty('navigation-rail-width', width) : undefined;
  return (
    <nav
      ref={rootRef}
      {...rest}
      {...hooks.root({
        className,
        data: { collapsed: isCollapsed, resizable: isResizable, resizing: liveWidth !== null },
      })}
      style={style}
    >
      <NavigationRailContext value={state}>
        <div {...hooks.slot('header')}>
          {header}
          <RailToggle
            isCollapsed={isCollapsed}
            bodyId={bodyId}
            onPress={() => setCollapsed(!isCollapsed)}
          />
        </div>
        <FocusScope>
          <RailBody id={bodyId}>{children}</RailBody>
        </FocusScope>
        {isEmptyNode(footer) ? null : <div {...hooks.slot('footer')}>{footer}</div>}
        {isResizable && !isCollapsed ? (
          <RailResizeHandle
            width={width}
            minWidth={minWidth}
            maxWidth={maxWidth}
            onResize={setLiveWidth}
            onResizeEnd={setWidth}
            owner={owner}
          />
        ) : null}
      </NavigationRailContext>
    </nav>
  );
}
