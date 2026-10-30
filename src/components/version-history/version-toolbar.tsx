'use client';

import { UsersGlyph } from '../../core/glyphs.js';
// The controls above a version history: the filters and the compare action.

import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu.js';
import { Switch } from '../switch/switch.js';
import type { VersionHistoryFilter } from './version-model.js';
import { versionHistoryHooks as hooks } from './version-row.js';

interface VersionToolbarProps {
  /** The filters, or `null` to leave them out. */
  filter: VersionHistoryFilter | null;
  onFilterChange: (filter: VersionHistoryFilter) => void;
  /** The people the person filter offers. */
  people: readonly string[];
  /** Runs the comparison, or `null` to leave the compare action out. */
  onCompare: (() => void) | null;
  /** Whether two versions are selected, so the compare action can run. */
  canCompare: boolean;
}

/** The person filter's key for everyone's versions; a person's name is never empty. */
const anyoneKey = '';

/** Chooses whose versions to show. */
function PersonFilter({
  filter,
  people,
  onFilterChange,
}: {
  filter: VersionHistoryFilter;
  people: readonly string[];
  onFilterChange: (filter: VersionHistoryFilter) => void;
}) {
  const strings = useUiStrings();
  const items = [
    { id: anyoneKey, label: strings.anyone },
    ...people.map((name) => ({ id: name, label: name })),
  ];
  return (
    <DropdownMenu
      label={strings.versionsBy(filter.person)}
      variant="ghost"
      size="sm"
      icon={UsersGlyph}
      className={hooks.slotClass('person')}
      items={items}
      selectionMode="single"
      selectedKeys={[filter.person ?? anyoneKey]}
      disallowEmptySelection
      onSelectionChange={(keys) => {
        const key: Key | undefined = keys === 'all' ? undefined : [...keys][0];
        if (key !== undefined)
          onFilterChange({ ...filter, person: key === anyoneKey ? null : String(key) });
      }}
    />
  );
}

/** The filters (named versions only, and by person) and the compare action, when shown. */
export function VersionToolbar({
  filter,
  onFilterChange,
  people,
  onCompare,
  canCompare,
}: VersionToolbarProps) {
  const strings = useUiStrings();
  return (
    <div {...hooks.slot('toolbar')}>
      {filter ? (
        <>
          <Switch
            size="sm"
            className={hooks.slotClass('named-only')}
            isSelected={filter.namedOnly}
            onChange={(namedOnly) => onFilterChange({ ...filter, namedOnly })}
          >
            {strings.namedVersionsOnly}
          </Switch>
          <PersonFilter filter={filter} people={people} onFilterChange={onFilterChange} />
        </>
      ) : null}
      {onCompare ? (
        <Button
          size="sm"
          className={hooks.slotClass('compare')}
          isDisabled={!canCompare}
          onPress={onCompare}
        >
          {strings.compareVersions}
        </Button>
      ) : null}
    </div>
  );
}
