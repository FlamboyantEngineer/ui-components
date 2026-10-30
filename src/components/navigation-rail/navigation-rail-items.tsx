// The sections, links and groups a navigation rail lists.

import { useContext, useId, useState, type JSX, type ReactNode } from 'react';
import {
  Button as AriaButton,
  Disclosure as AriaDisclosure,
  DisclosurePanel as AriaDisclosurePanel,
} from '../../primitives/index.js';
import type { PressEvent } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { formatCount, normalizeCount } from '../../utils/count.js';
import { getInitials } from '../../utils/initials.js';
import { Badge } from '../badge/badge.js';
import { useExpandGlyph } from '../expand-toggle/expand-toggle.js';
import { Icon, toIconProps, type IconSource } from '../icon/icon.js';
import { Link, renderLinkElement } from '../link/link.js';
import { Tooltip } from '../tooltip/tooltip.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import {
  CurrentItemContext,
  NavigationRailContext,
  navigationRailHooks as hooks,
  useCurrentItems,
  useReportCurrent,
} from './navigation-rail-state.js';

export interface NavigationRailSectionProps extends BaseProps {
  /** The section's title, which names its list. Without it the list is unnamed. */
  title?: string | undefined;
  /** The section's `NavigationRailItem`s and `NavigationRailGroup`s. */
  children?: ReactNode;
}

export interface NavigationRailItemProps extends BaseProps {
  /** The item's text, its tooltip while the rail is collapsed. */
  label: string;
  /** The destination, reached through the provider's link renderer. */
  href?: string | undefined;
  /** Called when the item is pressed, as for an item without `href`. */
  onPress?: ((event: PressEvent) => void) | undefined;
  /** The icon before the label, the item's tile while the rail is collapsed. */
  icon?: IconSource;
  /** A positive count after the label, such as unread entries; capped at 99+. */
  count?: number | undefined;
  /** What the count is read as, such as `4 unread`. Defaults to the count. */
  countLabel?: string | undefined;
  /** The item is the current page: `aria-current="page"`. */
  isCurrent?: boolean | undefined;
}

export interface NavigationRailGroupProps extends BaseProps {
  /** The group's text, on the button that opens it. */
  label: string;
  /** The icon before the label, the group's tile while the rail is collapsed. */
  icon?: IconSource;
  /** The group's `NavigationRailItem`s and nested groups. */
  children?: ReactNode;
  /** Whether the group is open (controlled). */
  isExpanded?: boolean | undefined;
  /** Whether the group starts open when uncontrolled. */
  defaultExpanded?: boolean | undefined;
  /** Called when the group opens or closes. */
  onExpandedChange?: ((isExpanded: boolean) => void) | undefined;
}

const countMax = 99;

interface ItemCountProps {
  id: string;
  count: number;
  description: string;
  isCollapsed: boolean;
}

/** The shown count, read as part of the link's name, and the hidden description of the full count. */
function ItemCount({ id, count, description, isCollapsed }: ItemCountProps) {
  const shown = formatCount(count, { max: countMax });
  return (
    <>
      {' '}
      <Badge
        className={hooks.slotClass('count')}
        count={count}
        max={countMax}
        size="sm"
        placement={isCollapsed ? 'overlay' : 'inline'}
        aria-label={shown}
      />
      <span id={id} hidden>
        {description}
      </span>
    </>
  );
}

// The tooltip of a collapsed group repeats the label the button is named by, so it describes nothing.
function renderUndescribedButton(props: JSX.IntrinsicElements['button']) {
  return <button {...props} aria-describedby={undefined} />;
}

interface EntryContentProps {
  label: string;
  icon: IconSource | undefined;
  isCollapsed: boolean;
}

/** An entry's icon, or its initials while collapsed without one, then its label. */
function EntryContent({ label, icon, isCollapsed }: EntryContentProps) {
  const text = isCollapsed ? (
    <VisuallyHidden elementType="span" className={hooks.slotClass('label')}>
      {label}
    </VisuallyHidden>
  ) : (
    <span {...hooks.slot('label')}>{label}</span>
  );
  let tile: ReactNode = null;
  if (icon) tile = <Icon {...toIconProps(icon)} className={hooks.slotClass('icon')} />;
  else if (isCollapsed) {
    tile = (
      <span {...hooks.slot('monogram')} aria-hidden="true">
        {getInitials(label)}
      </span>
    );
  }
  return (
    <>
      {tile}
      {text}
    </>
  );
}

/** A titled list of a rail's items and groups. Its title shows only while the rail is expanded. */
export function NavigationRailSection({
  title,
  children,
  className,
  ...rest
}: NavigationRailSectionProps) {
  const { isCollapsed } = useContext(NavigationRailContext);
  const titleId = useId();
  const titleProps = { id: titleId, className: hooks.slotClass('section-title') };
  return (
    <div {...rest} {...hooks.slot('section', undefined, className)}>
      {title === undefined ? null : isCollapsed ? (
        <VisuallyHidden elementType="span" {...titleProps}>
          {title}
        </VisuallyHidden>
      ) : (
        <span {...titleProps}>{title}</span>
      )}
      <ul {...hooks.slot('list')} aria-labelledby={title === undefined ? undefined : titleId}>
        {children}
      </ul>
    </div>
  );
}

/**
 * A link in the rail: an icon, a label and a count, `aria-current="page"` when it is the current
 * page. While the rail is collapsed it shows its icon, with the label in a tooltip.
 */
export function NavigationRailItem({
  label,
  href,
  onPress,
  icon,
  count,
  countLabel,
  isCurrent = false,
  className,
  ...rest
}: NavigationRailItemProps) {
  const strings = useUiStrings();
  const { isCollapsed } = useContext(NavigationRailContext);
  const descriptionId = useId();
  useReportCurrent(isCurrent);
  const shownCount = normalizeCount(count) ?? 0;
  const hasCount = shownCount > 0;
  // The collapsed tooltip repeats the label the link is named by, so only the count describes it.
  const describedBy = hasCount ? descriptionId : undefined;
  return (
    <li {...rest} {...hooks.slot('item', { current: isCurrent }, className)}>
      <Tooltip content={label} placement="end" isDisabled={!isCollapsed}>
        <Link
          className={hooks.slotClass('link')}
          href={href}
          onPress={onPress}
          variant="secondary"
          isStandalone
          underline="none"
          aria-current={isCurrent ? 'page' : undefined}
          render={(props) => renderLinkElement({ ...props, 'aria-describedby': describedBy })}
        >
          <EntryContent label={label} icon={icon} isCollapsed={isCollapsed} />
          {hasCount ? (
            <ItemCount
              id={descriptionId}
              count={shownCount}
              description={countLabel ?? strings.itemCount(shownCount)}
              isCollapsed={isCollapsed}
            />
          ) : null}
        </Link>
      </Tooltip>
    </li>
  );
}

/**
 * A group of items that opens and closes under a button. It publishes `data-current` while it
 * holds the current page, and opens when the current page moves inside it. In a collapsed rail
 * its items stay closed, and pressing it expands the rail and opens it.
 */
export function NavigationRailGroup({
  label,
  icon,
  children,
  isExpanded: expandedProp,
  defaultExpanded = false,
  onExpandedChange,
  className,
  ...rest
}: NavigationRailGroupProps) {
  const rail = useContext(NavigationRailContext);
  const [ownExpanded, setOwnExpanded] = useState(defaultExpanded);
  const [holdsCurrent, register] = useCurrentItems();
  useReportCurrent(holdsCurrent);
  // The current page moving inside opens the group; leaving it changes nothing.
  const [heldCurrent, setHeldCurrent] = useState(holdsCurrent);
  if (holdsCurrent !== heldCurrent) {
    setHeldCurrent(holdsCurrent);
    if (holdsCurrent) setOwnExpanded(true);
  }
  const isOpen = expandedProp ?? ownExpanded;
  const glyph = useExpandGlyph(isOpen && !rail.isCollapsed);
  const changeExpanded = (next: boolean) => {
    if (rail.isCollapsed) rail.expand();
    const value = rail.isCollapsed || next;
    setOwnExpanded(value);
    onExpandedChange?.(value);
  };
  return (
    <li {...rest} {...hooks.slot('item', { current: holdsCurrent }, className)}>
      <AriaDisclosure
        className={hooks.slotClass('group')}
        isExpanded={isOpen && !rail.isCollapsed}
        onExpandedChange={changeExpanded}
      >
        <Tooltip content={label} placement="end" isDisabled={!rail.isCollapsed}>
          <AriaButton
            className={hooks.slotClass('group-trigger')}
            slot="trigger"
            render={renderUndescribedButton}
          >
            <EntryContent label={label} icon={icon} isCollapsed={rail.isCollapsed} />
            <Glyph icon={glyph} className={hooks.slotClass('indicator')} />
          </AriaButton>
        </Tooltip>
        <AriaDisclosurePanel className={hooks.slotClass('group-panel')}>
          <CurrentItemContext value={register}>
            <ul {...hooks.slot('list')}>{children}</ul>
          </CurrentItemContext>
        </AriaDisclosurePanel>
      </AriaDisclosure>
    </li>
  );
}
