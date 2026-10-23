import { useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import { GridList, GridListHeader, GridListItem, GridListSection } from '../../primitives/index.js';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import { SearchField } from '../search-field/search-field.js';
import {
  filterCharacterCategories,
  formatCodePoints,
  type CharacterGridCategory,
  type CharacterGridCharacter,
} from './character-filter.js';
import { useRecentCharacters } from './use-recent-characters.js';

export type { CharacterGridCategory, CharacterGridCharacter } from './character-filter.js';

export interface CharacterGridProps extends BaseProps, AriaLabellingProps {
  /** The characters on offer, one section per category, in order. */
  categories: readonly CharacterGridCategory[];
  /** Called with the character the reader chooses. */
  onSelect: (character: CharacterGridCharacter) => void;
  /** Keeps the recently chosen characters in the provider's storage under this key. */
  persistKey?: string | undefined;
  /** Focuses the search field when the grid mounts. */
  autoFocus?: boolean | undefined;
}

interface CharacterSection {
  key: string;
  label: string;
  characters: readonly CharacterGridCharacter[];
}

const hooks = createHooks('character-grid', [
  'search',
  'grid',
  'section',
  'heading',
  'cell',
  'message',
  'preview',
  'preview-char',
  'preview-name',
  'preview-code',
]);

// Grid keys stay inside the grid, even at its edges where React Aria lets them bubble, so they
// never reach the menu or toolbar that holds it.
const gridKeys = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End']);

function getCellKey(section: string, char: string): string {
  return encodeURIComponent(JSON.stringify([section, char]));
}

/** The decorative preview of the character last hovered or focused: itself, its name and code. */
function CharacterPreview({ character }: { character: CharacterGridCharacter | null }) {
  return (
    <div {...hooks.slot('preview')} aria-hidden="true">
      {character ? (
        <>
          <span {...hooks.slot('preview-char')}>{character.char}</span>
          <span {...hooks.slot('preview-name')}>{character.name}</span>
          <span {...hooks.slot('preview-code')}>{formatCodePoints(character.char)}</span>
        </>
      ) : null}
    </div>
  );
}

interface CharacterSectionsProps {
  label: string;
  sections: readonly CharacterSection[];
  gridRef: RefObject<HTMLDivElement | null>;
  onAction: (key: Key) => void;
  onActiveChange: (character: CharacterGridCharacter) => void;
}

/** The grid list: one section per category, headed by its label, one cell per character. */
function CharacterSections({
  label,
  sections,
  gridRef,
  onAction,
  onActiveChange,
}: CharacterSectionsProps) {
  return (
    <GridList
      ref={gridRef}
      className={hooks.slotClass('grid')}
      aria-label={label}
      layout="grid"
      onAction={onAction}
    >
      {sections.map((section) => (
        <GridListSection
          key={section.key}
          id={toCollectionKey(section.key)}
          className={hooks.slotClass('section')}
        >
          <GridListHeader className={hooks.slotClass('heading')}>{section.label}</GridListHeader>
          {section.characters.map((character) => (
            <GridListItem
              key={getCellKey(section.key, character.char)}
              id={getCellKey(section.key, character.char)}
              className={hooks.slotClass('cell')}
              textValue={character.name}
              onHoverStart={() => onActiveChange(character)}
            >
              {character.char}
            </GridListItem>
          ))}
        </GridListSection>
      ))}
    </GridList>
  );
}

/** The sections shown: recent characters first while nothing is searched, else the matches. */
function useSections(
  categories: readonly CharacterGridCategory[],
  query: string,
  recent: readonly CharacterGridCharacter[],
) {
  const strings = useUiStrings();
  const shown: CharacterSection[] = filterCharacterCategories(categories, query).map(
    (category) => ({ key: `category-${category.id}`, ...category }),
  );
  if (query.trim() === '' && recent.length > 0) {
    shown.unshift({ key: 'recent', label: strings.recentCharacters, characters: recent });
  }
  const byKey = new Map<Key, CharacterGridCharacter>();
  shown.forEach((section) => {
    for (const character of section.characters)
      byKey.set(getCellKey(section.key, character.char), character);
  });
  return { sections: shown, byKey };
}

/**
 * A searchable grid of characters, such as symbols to insert, grouped in the caller's categories:
 * one React Aria grid list whose sections are headed by category, moved through with the arrow keys
 * in two dimensions. The search matches names and code points, the recently chosen characters lead
 * the grid (kept through the provider's storage), and a preview names the hovered or focused one.
 */
export function CharacterGrid({
  categories,
  onSelect,
  persistKey,
  autoFocus = false,
  className,
  id,
  ...rest
}: CharacterGridProps) {
  const strings = useUiStrings();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<CharacterGridCharacter | null>(null);
  const recent = useRecentCharacters(persistKey, categories);
  const { sections, byKey } = useSections(categories, query, recent.characters);
  const gridRef = useRef<HTMLDivElement>(null);
  const label = rest['aria-label'] ?? strings.characterGrid;
  const choose = (character: CharacterGridCharacter | undefined) => {
    if (!character) return;
    recent.remember(character);
    onSelect(character);
  };
  // Down from the search field moves to the first cell. A capture handler, since a search field
  // with a key handler of its own would keep Escape from closing the surface around it.
  const moveToGrid = (event: KeyboardEvent<HTMLElement>) => {
    const target = event.target as Element;
    if (event.key !== 'ArrowDown' || !target.closest(`.${hooks.slotClass('search')}`)) return;
    event.preventDefault();
    gridRef.current?.querySelector<HTMLElement>(`.${hooks.slotClass('cell')}`)?.focus();
  };
  return (
    <div
      {...hooks.root({ className, props: rest, data: { searching: query.trim() !== '' } })}
      id={id}
      role="group"
      aria-label={rest['aria-labelledby'] ? undefined : label}
      aria-labelledby={rest['aria-labelledby']}
      aria-describedby={rest['aria-describedby']}
      aria-details={rest['aria-details']}
      onFocus={(event) => {
        const character = byKey.get((event.target as HTMLElement).dataset.key ?? '');
        if (character) setActive(character);
      }}
      onKeyDownCapture={moveToGrid}
      onKeyDown={(event) => {
        if (gridKeys.has(event.key)) event.stopPropagation();
      }}
    >
      <SearchField
        className={hooks.slotClass('search')}
        label={strings.searchCharacters}
        placeholder={strings.searchCharacters}
        size="sm"
        value={query}
        onChange={setQuery}
        onSubmit={() => choose(sections[0]?.characters[0])}
        autoFocus={autoFocus}
      />
      {sections.length === 0 ? (
        <div {...hooks.slot('message')} role="status">
          {strings.noResults}
        </div>
      ) : (
        <CharacterSections
          label={label}
          sections={sections}
          gridRef={gridRef}
          onAction={(key) => choose(byKey.get(key))}
          onActiveChange={setActive}
        />
      )}
      <CharacterPreview character={active} />
    </div>
  );
}
