import { Button, Input, SearchField } from 'react-aria-components';
import { useUiStrings } from '../../core/provider.js';
import type { UiStrings } from '../../core/strings.js';
import { Icon } from '../icon/icon.js';
import { IconButton } from '../icon-button/icon-button.js';
import { pdfViewerHooks as hooks } from './styling-hooks.js';
import type { PdfSearchState } from './use-pdf-search.js';

export interface PdfViewerSearchProps {
  search: PdfSearchState;
}

/** What the result count reads: searching, no results, the current match of the total, or nothing. */
function describeSearchStatus(search: PdfSearchState, strings: UiStrings): string {
  if (search.isPending) return strings.searching;
  if (search.total > 0) return strings.stepOfTotal(search.current + 1, search.total);
  return search.query.trim() ? strings.noResults : '';
}

/** The find box, the result count and the previous and next match buttons. */
export function PdfViewerSearch({ search }: PdfViewerSearchProps) {
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
        <Input className={hooks.slotClass('search-input')} placeholder={strings.findInDocument} />
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
    </div>
  );
}
