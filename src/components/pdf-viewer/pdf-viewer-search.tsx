import type { RefObject } from 'react';
import { Button, Input, SearchField, type Selection } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import type { UiStrings } from '../../core/strings.js';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu.js';
import { Icon } from '../icon/icon.js';
import { IconButton } from '../icon-button/icon-button.js';
import { pdfViewerHooks as hooks } from './styling-hooks.js';
import type { PdfSearchOptions } from './pdf-search.js';
import type { PdfSearchState } from './use-pdf-search.js';

export interface PdfViewerSearchProps {
  search: PdfSearchState;
  /** The find field's input, which Ctrl + F focuses. */
  fieldRef: RefObject<HTMLInputElement | null>;
}

type SearchOptionKey = keyof PdfSearchOptions;

const optionKeys: readonly SearchOptionKey[] = [
  'highlightAll',
  'matchCase',
  'ignoreAccents',
  'wholeWords',
];

/** What the result count reads: searching, no results, the current match of the total, or nothing. */
function describeSearchStatus(search: PdfSearchState, strings: UiStrings): string {
  if (search.isPending) return strings.searching;
  if (search.total > 0) return strings.stepOfTotal(search.current + 1, search.total);
  return search.query.trim() ? strings.noResults : '';
}

/** The find options a menu selection turns on, every other one off. */
function toSearchOptions(keys: Selection): PdfSearchOptions {
  const isOn = (key: SearchOptionKey) => keys === 'all' || keys.has(key);
  return Object.fromEntries(optionKeys.map((key) => [key, isOn(key)]));
}

/** A menu of the find options, each one checked while it is on. */
function PdfViewerSearchOptions({ search }: Pick<PdfViewerSearchProps, 'search'>) {
  const strings = useUiStrings();
  const { options, setOptions } = search;
  return (
    <DropdownMenu
      iconOnly
      icon="chevron-down"
      label={strings.findOptions}
      size="sm"
      selectionMode="multiple"
      shouldCloseOnSelect={false}
      selectedKeys={optionKeys.filter((key) => options[key])}
      onSelectionChange={(keys) => setOptions(toSearchOptions(keys))}
      items={optionKeys.map((key) => ({ id: key, label: strings[key] }))}
    />
  );
}

/** The find box, the result count, the previous and next match buttons and the find options. */
export function PdfViewerSearch({ search, fieldRef }: PdfViewerSearchProps) {
  const strings = useUiStrings();
  const hasMatches = search.total > 0;
  return (
    <div {...hooks.slot('group')}>
      <SearchField
        className={hooks.slotClass('search-field')}
        aria-label={strings.findInDocument}
        value={search.query}
        onChange={search.setQuery}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' || !hasMatches) return;
          if (event.shiftKey) search.findPrevious();
          else search.findNext();
        }}
      >
        <Input
          ref={fieldRef}
          className={hooks.slotClass('search-input')}
          placeholder={strings.findInDocument}
        />
        <Button className={hooks.slotClass('search-clear')}>
          <Icon glyph="close" size="sm" />
        </Button>
      </SearchField>
      <span {...hooks.slot('search-status')} role="status">
        {describeSearchStatus(search, strings)}
      </span>
      <IconButton
        icon="chevron-left"
        label={strings.previousMatch}
        size="sm"
        isDisabled={!hasMatches}
        onPress={search.findPrevious}
      />
      <IconButton
        icon="chevron-right"
        label={strings.nextMatch}
        size="sm"
        isDisabled={!hasMatches}
        onPress={search.findNext}
      />
      <PdfViewerSearchOptions search={search} />
    </div>
  );
}
