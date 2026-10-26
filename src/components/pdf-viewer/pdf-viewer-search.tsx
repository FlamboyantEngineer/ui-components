import type { RefObject } from 'react';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { FindBar } from '../find-bar/find-bar.js';
import { pdfViewerHooks as hooks } from './styling-hooks.js';
import type { PdfSearchOptions } from './pdf-search.js';
import type { PdfSearchState } from './use-pdf-search.js';

interface PdfViewerSearchProps {
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

/** The find options the menu turns on, every other one off. */
function toSearchOptions(keys: ReadonlySet<Key>): PdfSearchOptions {
  return Object.fromEntries(optionKeys.map((key) => [key, keys.has(key)]));
}

/** The viewer's find row, a Find Bar: the find box, the result count, the match buttons and the options. */
export function PdfViewerSearch({ search, fieldRef }: PdfViewerSearchProps) {
  const strings = useUiStrings();
  const { options, setOptions } = search;
  return (
    <FindBar
      className={hooks.slotClass('group')}
      label={strings.findInDocument}
      placeholder={strings.findInDocument}
      query={search.query}
      onQueryChange={search.setQuery}
      matchCount={search.query.trim() ? search.total : undefined}
      currentIndex={search.current}
      isPending={search.isPending}
      onNext={search.findNext}
      onPrevious={search.findPrevious}
      options={optionKeys.map((key) => ({ id: key, label: strings[key] }))}
      selectedOptions={optionKeys.filter((key) => options[key])}
      onSelectedOptionsChange={(keys) => setOptions(toSearchOptions(keys))}
      inputRef={fieldRef}
    />
  );
}
