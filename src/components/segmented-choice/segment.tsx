'use client';

import { SelectionIndicator, ToggleButton, useLocale } from '../../primitives/index.js';
import type { ControlSize } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { formatCount, normalizeCount } from '../../utils/count.js';
import { Badge, type BadgeCountVariant } from '../badge/badge.js';
import { Icon, hasIcon, toIconProps } from '../icon/icon.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { Tooltip } from '../tooltip/tooltip.js';
import type { SegmentedChoiceOption } from './segmented-choice.js';
import { segmentedChoiceHooks as hooks } from './segmented-choice-hooks.js';

interface SegmentProps {
  option: SegmentedChoiceOption;
  size: ControlSize;
  iconOnly: boolean;
  countMax: number;
  showZero: boolean;
  countVariant: BadgeCountVariant | undefined;
}

/** A count the option actually shows, retaining zero only when requested. */
function resolveSegmentCount(
  count: number | null | undefined,
  showZero: boolean,
): number | undefined {
  if (typeof count !== 'number' || count < 0) return undefined;
  const value = normalizeCount(count);
  return !showZero && value === 0 ? undefined : value;
}

export function Segment({
  option,
  size,
  iconOnly,
  countMax,
  showZero,
  countVariant,
}: SegmentProps) {
  const strings = useUiStrings();
  const { locale } = useLocale();
  const showsIconOnly = iconOnly && hasIcon(option.icon);
  const count = resolveSegmentCount(option.count, showZero);
  const hasCount = count !== undefined;
  const max = option.countMax ?? countMax;
  // The name keeps the exact count, even when the visible badge is capped.
  const name = !hasCount
    ? option.label
    : strings.labelWithCount(option.label, formatCount(count, locale));
  const segment = (
    <ToggleButton
      id={option.value}
      isDisabled={option.isDisabled}
      aria-label={showsIconOnly ? name : undefined}
      {...hooks.slot('segment', { value: option.value })}
    >
      <SelectionIndicator className={hooks.slotClass('indicator')} />
      {hasIcon(option.icon) ? (
        <Icon
          {...toIconProps(option.icon)}
          size={size === 'xs' ? 'sm' : size}
          className={hooks.slotClass('icon')}
        />
      ) : null}
      {showsIconOnly ? null : (
        <span {...hooks.slot('label', { label: option.label })} aria-hidden={hasCount || undefined}>
          {option.label}
        </span>
      )}
      {hasCount ? (
        <Badge
          className={hooks.slotClass('count')}
          count={count}
          max={max}
          variant={countVariant}
          size="sm"
          aria-hidden
        />
      ) : null}
      {hasCount ? (
        <VisuallyHidden as="span" className={hooks.slotClass('accessible-label')}>
          {name}
        </VisuallyHidden>
      ) : null}
    </ToggleButton>
  );
  // Keeping the tooltip mounted preserves the native button and focus as icons arrive or leave.
  return (
    <Tooltip
      content={option.label}
      relationship={showsIconOnly ? 'label' : 'description'}
      isDisabled={!showsIconOnly}
    >
      {segment}
    </Tooltip>
  );
}
