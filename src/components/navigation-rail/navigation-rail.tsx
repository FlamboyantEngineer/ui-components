import { useId, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { FocusScope, useFocusManager, useLocale } from '../../primitives/index.js';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { clamp } from '../../utils/clamp.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { IconButton } from '../icon-button/icon-button.js';
import { ResizeHandle } from '../split-view/split-view.js';
import {
  NavigationRailContext,
  collapsedCodec,
  navigationRailHooks as hooks,
  usePersistedValue,
  widthCodec,
} from './navigation-rail-state.js';

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
}

/** The handle that resizes the expanded rail: live while dragging, committed when the drag ends. */
function RailResizeHandle({ width, minWidth, maxWidth, onResize, onResizeEnd }: RailResizeProps) {
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
      onChange={onResize}
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
    <IconButton
      className={hooks.slotClass('toggle')}
      icon={pointsLeft ? 'chevron-double-left' : 'chevron-double-right'}
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
  const [isCollapsed, setCollapsed] = usePersistedValue({
    value: collapsedProp,
    defaultValue: defaultCollapsed,
    onChange: onCollapsedChange,
    persistKey: persistKey === undefined ? undefined : `${persistKey}:collapsed`,
    codec: collapsedCodec,
  });
  const [committedWidth, setWidth] = usePersistedValue({
    value: widthProp,
    defaultValue: defaultWidth,
    onChange: onWidthChange,
    persistKey: persistKey === undefined ? undefined : `${persistKey}:width`,
    codec: widthCodec,
  });
  const [liveWidth, setLiveWidth] = useState<number | null>(null);
  // A stored or controlled width outside the bounds is drawn at the nearest bound.
  const width = clamp(liveWidth ?? committedWidth, minWidth, maxWidth);
  const state = useMemo(
    () => ({ isCollapsed, expand: () => setCollapsed(false) }),
    [isCollapsed, setCollapsed],
  );
  const style = isResizable
    ? ({ '--ui-navigation-rail-width': `${width}px` } as CSSProperties)
    : undefined;
  return (
    <nav
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
          />
        ) : null}
      </NavigationRailContext>
    </nav>
  );
}
