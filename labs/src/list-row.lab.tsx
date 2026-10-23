import { useRef, useState } from 'react';
import { IconButton } from '../../src/components/icon-button/icon-button.js';
import {
  List,
  ListRow,
  type ListHandle,
  type ListRowProps,
} from '../../src/components/list-row/list-row.js';
import { MetaLine } from '../../src/components/meta-line/meta-line.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import {
  LongListCase,
  ReorderCase,
  SectionsCase,
  SelectionCase,
  selections,
} from './list-view-cases.js';

const kinds = ['link', 'action', 'static'] as const;
const states = ['default', 'current', 'disabled', 'danger'] as const;
const contents = ['title', 'meta', 'icon', 'leading', 'trailing'] as const;

function kindProps(kind: (typeof kinds)[number], id: string): Partial<ListRowProps> {
  if (kind === 'link') return { href: `#${id}` };
  if (kind === 'action') return { onPress: () => {} };
  return {};
}

function Avatar({ initials }: { initials: string }) {
  return (
    <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
      <circle cx="16" cy="16" r="16" fill="currentColor" opacity="0.15" />
      <text x="16" y="21" textAnchor="middle" fontSize="13" fill="currentColor">
        {initials}
      </text>
    </svg>
  );
}

const CITIES = [
  { id: 'lisbon', title: 'Lisbon', meta: ['Portugal', '545,000 people'] },
  { id: 'oslo', title: 'Oslo', meta: ['Norway', '709,000 people'] },
  { id: 'quito', title: 'Quito', meta: ['Ecuador', '2.8 million people'], disabled: true },
  { id: 'kyoto', title: 'Kyoto', meta: ['Japan', '1.5 million people'] },
  { id: 'accra', title: 'Accra', meta: ['Ghana', '2.5 million people'] },
];

function SearchResults() {
  const handle = useRef<ListHandle>(null);
  const input = useRef<HTMLInputElement>(null);
  const [opened, setOpened] = useState('nothing yet');
  return (
    <div data-lab-search>
      <label>
        Filter cities{' '}
        <input
          ref={input}
          type="search"
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              handle.current?.focusFirst();
            }
          }}
        />
      </label>
      <List
        aria-label="Cities"
        divided
        handleRef={handle}
        onNavigatePastStart={() => input.current?.focus()}
      >
        {CITIES.map((city) => (
          <ListRow
            key={city.id}
            data-city={city.id}
            title={city.title}
            meta={<MetaLine items={city.meta} />}
            icon="info"
            isDisabled={city.disabled}
            onPress={() => setOpened(city.title)}
            trailing={<IconButton icon="more" label={`More about ${city.title}`} size="sm" />}
          />
        ))}
      </List>
      <p data-lab-output>Opened: {opened}</p>
    </div>
  );
}

function RemovableRows() {
  const [names, setNames] = useState(['Apple', 'Banana', 'Cherry', 'Damson', 'Elderberry']);
  return (
    <List aria-label="Fruit basket" data-lab-removable>
      {names.map((name) => (
        <ListRow
          key={name}
          data-fruit={name}
          title={name}
          onPress={() => {}}
          trailing={
            <IconButton
              icon="close"
              size="sm"
              label={`Remove ${name}`}
              onPress={() => setNames((current) => current.filter((entry) => entry !== name))}
            />
          }
        />
      ))}
    </List>
  );
}

mountLab(
  <>
    <LabSection
      title="Kinds and states"
      description="A link, an action button and a read-only row in each state."
    >
      <StateMatrix
        axes={{ kind: kinds, state: states }}
        render={({ kind, state }) => (
          <div data-lab-column="260" style={{ width: 260 }}>
            <List aria-label={`${kind} ${state}`}>
              <ListRow
                {...kindProps(kind, `${kind}-${state}`)}
                title="Report.pdf"
                meta="Updated yesterday"
                icon="info"
                isCurrent={state === 'current'}
                isDisabled={state === 'disabled'}
                tone={state === 'danger' ? 'danger' : 'neutral'}
              />
            </List>
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Content"
      description="Title only, title and meta, an icon through Icon Label, decorative leading media, and trailing controls beside the primary control."
    >
      <StateMatrix
        axes={{ content: contents, kind: kinds }}
        render={({ content, kind }) => (
          <div data-lab-column="260" style={{ width: 260 }}>
            <List aria-label={`${content} ${kind}`}>
              <ListRow
                {...kindProps(kind, `${content}-${kind}`)}
                title="Ada Lovelace"
                meta={content === 'title' ? undefined : 'Mathematician · London'}
                icon={content === 'icon' ? 'info' : undefined}
                leading={content === 'leading' ? <Avatar initials="AL" /> : undefined}
                trailing={
                  content === 'trailing' ? (
                    <IconButton icon="more" label="More about Ada Lovelace" size="sm" />
                  ) : undefined
                }
              />
            </List>
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Keyboard navigation"
      description="One tab stop: arrows, Home and End move between rows and skip the disabled one. ArrowDown in the field enters the list; ArrowUp on the first row returns to it. Tab reaches each row's trailing button."
    >
      <SearchResults />
    </LabSection>
    <LabSection
      title="Focus recovery"
      description="Remove the focused row with its trailing button: focus moves to the nearest remaining row."
    >
      <RemovableRows />
    </LabSection>
    <LabSection
      title="Narrow rows"
      description="In a 240px column the title and meta ellipsize on one line each and trailing content moves below the text."
    >
      <div data-lab-narrow style={{ width: 240 }}>
        <List aria-label="Narrow list" divided>
          <ListRow
            href="#narrow"
            title="Quarterly planning notes for the garden committee"
            meta={<MetaLine items={['Shared folder', 'Edited by Grace Hopper', '3 days ago']} />}
            icon="info"
            trailing={<span data-lab-badge>New</span>}
          />
          <ListRow title="Short title" meta="Short meta" trailing={<span>New</span>} />
        </List>
      </div>
    </LabSection>
    <LabSection title="Pending" description="A list whose rows are being updated.">
      <List aria-label="Updating list" isPending>
        <ListRow title="Photos.zip" meta="Uploading" />
        <ListRow title="Notes.txt" meta="Waiting" />
      </List>
    </LabSection>
    <LabSection
      title="List view selection"
      description="A List View in each selection mode: checkboxes while it selects with toggles, a press replaces the selection in replace mode. Damson is disabled; typing a letter moves to the matching row. Initial selection and disabled keys are generators that survive selection updates."
    >
      <StateMatrix
        axes={{ selection: selections }}
        render={({ selection }) => (
          <div data-lab-column="300" style={{ width: 300 }}>
            <SelectionCase selection={selection} />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="List view sections"
      description="Sections under header rows; the headers stay in view while their rows scroll."
    >
      <div style={{ width: 300 }}>
        <SectionsCase />
      </div>
    </LabSection>
    <LabSection
      title="List view reordering"
      description="Drag a row, or press Enter on its drag handle and use the arrow keys, to reorder."
    >
      <div style={{ width: 300 }}>
        <ReorderCase />
      </div>
    </LabSection>
    <LabSection
      title="Long list view"
      description="Show the list: only the rows in view render, and the next page loads as the end of the list scrolls into view."
    >
      <div style={{ width: 300 }}>
        <LongListCase />
      </div>
    </LabSection>
  </>,
);
