import { useState } from 'react';
import { ActionRow, type ActionRowAction } from '../../src/components/action-row/action-row.js';
import { Button } from '../../src/components/button/button.js';
import { Cluster } from '../../src/components/layout/layout.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import { Switch } from '../../src/components/switch/switch.js';
import {
  CloseGlyph as ActionCloseGlyph,
  CopyGlyph,
  DeleteGlyph as ActionDeleteGlyph,
  DeleteGlyph,
  EditGlyph as ActionEditGlyph,
  EditGlyph,
  ExpandGlyph,
  HelpGlyph,
  MoreGlyph as ActionMoreGlyph,
  PlusGlyph as ActionPlusGlyph,
  RefreshGlyph as ActionRefreshGlyph,
  SaveGlyph as ActionSaveGlyph,
  SearchGlyph,
  SortAscendingGlyph,
  UploadGlyph,
} from '../../src/core/glyphs.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';

const sizes = ['xs', 'sm', 'md', 'lg'] as const;
const states = ['default', 'selected', 'disabled', 'pending', 'with lead'] as const;
const noop = () => undefined;

// Lab-only frame: a row puts its actions at its end, so on a wide page they would sit far from
// everything else; each case keeps to a readable width.
const caseFrame = { maxWidth: 420 };

function actionsFor(state: (typeof states)[number]): ActionRowAction[] {
  return [
    {
      id: 'full-screen',
      icon: ExpandGlyph,
      label: 'Full screen',
      isSelected: state === 'selected',
      onPress: noop,
    },
    {
      id: 'add',
      icon: ActionPlusGlyph,
      label: 'Add note',
      isDisabled: state === 'disabled',
      onPress: noop,
    },
    {
      id: 'refresh',
      label: 'Refresh',
      icon: ActionRefreshGlyph,
      isDisabled: state === 'disabled',
      onPress: noop,
    },
    {
      id: 'save',
      label: 'Save',
      icon: ActionSaveGlyph,
      pendingLabel: 'Saving',
      isPending: state === 'pending',
      onPress: noop,
    },
    { id: 'cancel', label: 'Cancel', icon: ActionCloseGlyph, onPress: noop },
  ];
}

function MoreMenu() {
  const [last, setLast] = useState('none');
  return (
    <div style={caseFrame} data-lab-case="more-menu">
      <ActionRow
        lead={<strong>Report.pdf</strong>}
        actions={[
          { id: 'edit', label: 'Edit', icon: ActionEditGlyph, onPress: () => setLast('edit') },
          {
            id: 'more',
            label: 'More actions',
            icon: ActionMoreGlyph,
            onAction: (key) => setLast(String(key)),
            items: [
              { id: 'rename', label: 'Rename', icon: EditGlyph, shortcut: 'F2' },
              { id: 'duplicate', label: 'Duplicate' },
              { id: 'export', label: 'Export', icon: UploadGlyph, description: 'As PDF' },
              { id: 'share', label: 'Share', isDisabled: true },
              { type: 'separator', id: 'rule' },
              { id: 'delete', label: 'Delete', icon: DeleteGlyph, tone: 'danger' },
            ],
          },
          {
            id: 'sort',
            icon: SortAscendingGlyph,
            label: 'Sort',
            onAction: (key) => setLast(`sort ${String(key)}`),
            items: [
              {
                type: 'section',
                id: 'order',
                title: 'Order by',
                items: [
                  { id: 'name', label: 'Name' },
                  { id: 'date', label: 'Date modified' },
                ],
              },
            ],
          },
          {
            id: 'refresh',
            label: 'Refresh',
            icon: ActionRefreshGlyph,
            onPress: () => setLast('refresh'),
          },
        ]}
      />
      <p>
        Last action: <output data-lab-output="last">{last}</output>
      </p>
    </div>
  );
}

const rowWidths = { wide: 360, narrow: 180 } as const;

function CollapsingRow({ width }: { width: keyof typeof rowWidths }) {
  const [last, setLast] = useState('none');
  const press = (name: string) => () => setLast(name);
  return (
    <div style={{ width: rowWidths[width] }} data-lab-row={width}>
      <ActionRow
        toolbar
        overflow="menu"
        aria-label={`File actions, ${width}`}
        lead={<span>Report.pdf</span>}
        actions={[
          {
            id: 'duplicate',
            icon: CopyGlyph,
            label: 'Duplicate',
            onPress: press('duplicate'),
          },
          { id: 'add', icon: ActionPlusGlyph, label: 'Add note', onPress: press('add') },
          { id: 'refresh', label: 'Refresh', icon: ActionRefreshGlyph, onPress: press('refresh') },
          { id: 'edit', label: 'Edit', icon: ActionEditGlyph, onPress: press('edit') },
          { id: 'delete', label: 'Delete', icon: ActionDeleteGlyph, onPress: press('delete') },
        ]}
      />
      <p>
        Last action: <output data-lab-output="last">{last}</output>
      </p>
    </div>
  );
}

/** A save that takes a while, in a row narrow enough to put it in the overflow menu. */
function SlowSave() {
  const [saves, setSaves] = useState(0);
  const save = () => {
    setSaves((count) => count + 1);
    return new Promise<void>((resolve) => setTimeout(resolve, 2000));
  };
  return (
    <div data-lab-case="slow-save">
      {/* Too narrow for any action, so every action is in the more menu. */}
      <div style={{ width: 30 }}>
        <ActionRow
          overflow="menu"
          actions={[
            { id: 'refresh', label: 'Refresh', icon: ActionRefreshGlyph, onPress: noop },
            {
              id: 'save',
              label: 'Save',
              icon: ActionSaveGlyph,
              pendingLabel: 'Saving',
              onPress: save,
            },
          ]}
        />
      </div>
      <p>
        Saves started: <output data-lab-output="saves">{saves}</output>
      </p>
    </div>
  );
}

/** An action that removes itself: focus moves to the next action's own button. */
function ChangingActions() {
  const [hasArchive, setHasArchive] = useState(true);
  const [last, setLast] = useState('none');
  const archive: ActionRowAction = {
    id: 'archive',
    icon: UploadGlyph,
    label: 'Archive',
    onPress: () => {
      setLast('archive');
      setHasArchive(false);
    },
  };
  const share: ActionRowAction = {
    id: 'share',
    icon: CopyGlyph,
    label: 'Share',
    onPress: () => setLast('share'),
  };
  return (
    <div style={caseFrame} data-lab-case="changing">
      <ActionRow
        toolbar
        aria-label="Changing actions"
        actions={hasArchive ? [archive, share] : [share]}
      />
      <button type="button" onClick={() => setHasArchive(true)}>
        Restore archive
      </button>
      <p>
        Last action: <output data-lab-output="last">{last}</output>
      </p>
    </div>
  );
}

/** A more action that loads its entries on demand: its button keeps focus as they arrive. */
function LoadedEntries() {
  const [items, setItems] = useState<ActionRowAction['items']>([]);
  const [last, setLast] = useState('none');
  const more: ActionRowAction = {
    id: 'more',
    label: 'More',
    icon: ActionMoreGlyph,
    items,
    onPress: () => {
      setLast('load');
      setTimeout(() => {
        setItems([
          { id: 'export', label: 'Export' },
          { id: 'print', label: 'Print' },
        ]);
      }, 300);
    },
    onAction: (key) => setLast(String(key)),
  };
  return (
    <div style={caseFrame} data-lab-case="loaded">
      <ActionRow toolbar aria-label="Loaded entries" actions={[more]} />
      <button type="button" onClick={() => setItems([])}>
        Clear entries
      </button>
      <p>
        Last action: <output data-lab-output="last">{last}</output>
      </p>
    </div>
  );
}

/** Menu actions whose item ids repeat: each overflow submenu still reports to its own action. */
function SharedIdMenus() {
  const [last, setLast] = useState('none');
  const menuAction = (id: string, label: string): ActionRowAction => ({
    id,
    icon: id === 'sheet' ? CopyGlyph : SortAscendingGlyph,
    label,
    onAction: (key) => setLast(`${id} ${String(key)}`),
    items: [
      { id: 'open', label: `Open ${id}` },
      { id: 'share', label: `Share ${id}` },
    ],
  });
  return (
    <div data-lab-case="shared-ids">
      {/* Too narrow for any action, so every action is in the more menu. */}
      <div style={{ width: 30 }}>
        <ActionRow
          overflow="menu"
          actions={[menuAction('sheet', 'Sheet'), menuAction('chart', 'Chart')]}
        />
      </div>
      <p>
        Last action: <output data-lab-output="last">{last}</output>
      </p>
    </div>
  );
}

function SelectionBar() {
  const [selected, setSelected] = useState(['Apple', 'Cherry']);
  const fruit = ['Apple', 'Banana', 'Cherry'];
  return (
    <div style={caseFrame} data-lab-case="selection">
      {fruit.map((name) => (
        <label key={name} style={{ display: 'block' }}>
          <input
            type="checkbox"
            checked={selected.includes(name)}
            onChange={(event) =>
              setSelected((current) =>
                event.target.checked ? [...current, name] : current.filter((item) => item !== name),
              )
            }
          />{' '}
          {name}
        </label>
      ))}
      {selected.length > 0 ? (
        <ActionRow
          toolbar
          onKeyDown={(event) => {
            if (event.key === 'Escape' && !event.defaultPrevented && !event.nativeEvent.isComposing)
              setSelected([]);
          }}
          aria-label="Bulk actions"
          lead={
            <Cluster>
              <Button size="sm" onPress={() => setSelected([])}>
                Clear selection
              </Button>
              <span role="status">{selected.length} selected</span>
              <input aria-label="Note for the selection" placeholder="Note" />
            </Cluster>
          }
          actions={[
            { id: 'edit', icon: ActionEditGlyph, label: 'Edit selected', onPress: noop },
            {
              id: 'delete',
              icon: ActionDeleteGlyph,
              label: 'Delete selected',
              onPress: () => setSelected([]),
            },
          ]}
        />
      ) : null}
    </div>
  );
}

const leadChoices = {
  title: {
    label: 'Title',
    value: <strong>Quarterly notes</strong>,
    shown: '<strong>Quarterly notes</strong>',
  },
  zero: { label: 'Number 0', value: 0, shown: '0' },
  empty: { label: 'Empty string', value: '', shown: "''" },
  null: { label: 'null', value: null, shown: 'null' },
  none: { label: 'Not set', value: undefined, shown: 'undefined' },
} as const;
type LeadChoice = keyof typeof leadChoices;

/** A row whose actions and lead can be cleared: with neither it renders nothing. */
function EmptyRow() {
  const [hasActions, setHasActions] = useState(true);
  const [lead, setLead] = useState<LeadChoice>('title');
  const actions: ActionRowAction[] = hasActions
    ? [
        { id: 'edit', label: 'Edit', icon: ActionEditGlyph, onPress: noop },
        { id: 'delete', label: 'Delete', icon: ActionDeleteGlyph, onPress: noop },
      ]
    : [];
  return (
    <div style={caseFrame} data-lab-case="empty-row">
      <div role="group" aria-label="Row inputs">
        <Switch isSelected={hasActions} onChange={setHasActions}>
          Actions
        </Switch>
        <SegmentedChoice
          aria-label="Lead"
          sizing="content"
          options={Object.entries(leadChoices).map(([value, choice]) => ({
            value,
            label: choice.label,
          }))}
          value={lead}
          onChange={(value) => setLead((value as LeadChoice | null) ?? 'title')}
        />
      </div>
      <div data-lab-case="empty-row-target">
        <ActionRow lead={leadChoices[lead].value} actions={actions} />
      </div>
      <output aria-label="Selected inputs" data-lab-output="inputs">
        {`actions: ${String(actions.length)}, lead: ${leadChoices[lead].shown}`}
      </output>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Sizes and states"
      description="Hover or tab to an action to see its tooltip. Actions retain the order supplied by the caller."
    >
      <StateMatrix
        axes={{ state: states, size: sizes }}
        render={({ state, size }) => (
          <ActionRow
            size={size}
            actions={actionsFor(state)}
            {...(state === 'with lead' ? { lead: <span>Notes · 3</span> } : {})}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Caller order"
      description="Actions supplied in a deliberate order, drawn in the caller's order."
    >
      <div style={caseFrame} data-lab-case="order">
        <ActionRow
          actions={[
            { id: 'close', label: 'Close', icon: ActionCloseGlyph, onPress: noop },
            { id: 'cancel', label: 'Cancel', icon: ActionCloseGlyph, onPress: noop },
            {
              id: 'save',
              label: 'Save',
              icon: ActionSaveGlyph,
              pendingLabel: 'Saving',
              onPress: noop,
            },
            { id: 'delete', label: 'Delete', icon: ActionDeleteGlyph, onPress: noop },
            { id: 'edit', label: 'Edit', icon: ActionEditGlyph, onPress: noop },
            { id: 'help', icon: HelpGlyph, label: 'Help', onPress: noop },
            { id: 'more', label: 'More', icon: ActionMoreGlyph, onPress: noop },
            { id: 'refresh', label: 'Refresh', icon: ActionRefreshGlyph, onPress: noop },
            { id: 'add', label: 'Add', icon: ActionPlusGlyph, onPress: noop },
            { id: 'search', icon: SearchGlyph, label: 'Search', onPress: noop },
          ]}
        />
      </div>
    </LabSection>
    <LabSection
      title="Custom action without an icon"
      description="A custom action's icon is optional: without one it shows its label as text, still a toggle."
    >
      <div style={caseFrame} data-lab-case="no-icon">
        <ActionRow
          actions={[
            { id: 'schedule', label: 'Schedule', isSelected: false, onPress: noop },
            { id: 'help', icon: HelpGlyph, label: 'Help', onPress: noop },
          ]}
        />
      </div>
    </LabSection>
    <LabSection
      title="Menus and disabled reason"
      description="The More and Sort actions open menus of typed items. The disabled delete keeps focus so its tooltip can explain why."
    >
      <MoreMenu />
      <div style={caseFrame} data-lab-case="disabled-reason">
        <ActionRow
          actions={[
            {
              id: 'delete',
              label: 'Delete',
              icon: ActionDeleteGlyph,
              isDisabled: true,
              tooltip: 'Only the owner can delete this file',
              onPress: noop,
            },
          ]}
        />
      </div>
    </LabSection>
    <LabSection
      title="Toolbar and overflow menu"
      description="Each row is one toolbar: tab to it once and move with the arrow keys. In the 180px row the actions that do not fit move into a menu at its end."
    >
      <StateMatrix
        axes={{ width: ['wide', 'narrow'] }}
        render={({ width }) => <CollapsingRow width={width} />}
      />
    </LabSection>
    <LabSection
      title="Pending action in the overflow menu"
      description="Save takes two seconds. Choose it from the more menu, reopen the menu: Save is busy and refuses another choice until the first save ends."
    >
      <SlowSave />
    </LabSection>
    <LabSection
      title="Actions that come and go"
      description="Archive removes itself: focus moves to Share's own button, and Enter then runs Share. Restore archive brings it back."
    >
      <ChangingActions />
    </LabSection>
    <LabSection
      title="Menu entries that load"
      description="More starts without entries and loads them when pressed. As they arrive it keeps its button and focus, so Enter then opens the menu. Clear entries makes it a plain button again."
    >
      <LoadedEntries />
    </LabSection>
    <LabSection
      title="Overflow menus that share item ids"
      description="Both actions' menus have an Open item with the same id. Collapsed into the more menu, each submenu still reports to its own action."
    >
      <SharedIdMenus />
    </LabSection>
    <LabSection
      title="Selection bar"
      description="With a selected count the row shows the count and a clear button, and disappears when nothing is selected. Escape inside it clears the selection, except the Escape that cancels an input method candidate in the note field."
    >
      <SelectionBar />
    </LabSection>
    <LabSection
      title="Empty and lead-only rows"
      description="Turn the actions off for a lead-only row. With no actions and an empty lead (not set, null or the empty string) the row renders nothing; the number 0 is content and keeps it."
    >
      <EmptyRow />
    </LabSection>
  </>,
);
