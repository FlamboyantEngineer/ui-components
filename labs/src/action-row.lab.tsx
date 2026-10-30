import {
  CopyGlyph,
  DeleteGlyph,
  EditGlyph,
  ExpandGlyph,
  HelpGlyph,
  SearchGlyph,
  SortAscendingGlyph,
  UploadGlyph,
} from '../../src/core/glyphs.js';
import { useState } from 'react';
import { ActionRow, type ActionRowAction } from '../../src/components/action-row/action-row.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const sizes = ['xs', 'sm', 'md', 'lg'] as const;
const states = ['default', 'selected', 'disabled', 'pending', 'with lead'] as const;
const noop = () => undefined;

function actionsFor(state: (typeof states)[number]): ActionRowAction[] {
  return [
    {
      verb: 'custom',
      icon: ExpandGlyph,
      label: 'Full screen',
      isSelected: state === 'selected',
      onPress: noop,
    },
    { verb: 'add', label: 'Add note', isDisabled: state === 'disabled', onPress: noop },
    { verb: 'refresh', isDisabled: state === 'disabled', onPress: noop },
    { verb: 'save', isPending: state === 'pending', onPress: noop },
    { verb: 'cancel', onPress: noop },
  ];
}

function MoreMenu() {
  const [last, setLast] = useState('none');
  return (
    <div data-lab-case="more-menu">
      <ActionRow
        lead={<strong>Report.pdf</strong>}
        actions={[
          { verb: 'edit', onPress: () => setLast('edit') },
          {
            verb: 'more',
            label: 'More actions',
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
            verb: 'custom',
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
          { verb: 'refresh', onPress: () => setLast('refresh') },
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
          { verb: 'custom', icon: CopyGlyph, label: 'Duplicate', onPress: press('duplicate') },
          { verb: 'add', label: 'Add note', onPress: press('add') },
          { verb: 'refresh', onPress: press('refresh') },
          { verb: 'edit', onPress: press('edit') },
          { verb: 'delete', onPress: press('delete') },
        ]}
      />
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
    <div data-lab-case="selection">
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
      <ActionRow
        toolbar
        aria-label="Bulk actions"
        selectedCount={selected.length}
        onClearSelection={() => setSelected([])}
        actions={[
          { verb: 'edit', label: 'Edit selected', onPress: noop },
          { verb: 'delete', label: 'Delete selected', onPress: () => setSelected([]) },
        ]}
      />
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Sizes and states"
      description="Hover or tab to an action to see its tooltip. Custom actions come first, then the verbs in their fixed order."
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
      title="Fixed order"
      description="Every verb given in reverse order, plus two custom actions, drawn in the row's order."
    >
      <div data-lab-case="order">
        <ActionRow
          actions={[
            { verb: 'close', onPress: noop },
            { verb: 'cancel', onPress: noop },
            { verb: 'save', onPress: noop },
            { verb: 'delete', onPress: noop },
            { verb: 'edit', onPress: noop },
            { verb: 'custom', icon: HelpGlyph, label: 'Help', onPress: noop },
            { verb: 'more', onPress: noop },
            { verb: 'refresh', onPress: noop },
            { verb: 'add', onPress: noop },
            { verb: 'custom', icon: SearchGlyph, label: 'Search', onPress: noop },
          ]}
        />
      </div>
    </LabSection>
    <LabSection
      title="Menus and disabled reason"
      description="The more verb and the custom sort action open menus of typed items. The disabled delete keeps focus so its tooltip can explain why."
    >
      <MoreMenu />
      <div data-lab-case="disabled-reason">
        <ActionRow
          actions={[
            {
              verb: 'delete',
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
      title="Selection bar"
      description="With a selected count the row shows the count and a clear button, and disappears when nothing is selected. Escape inside it clears the selection."
    >
      <SelectionBar />
    </LabSection>
  </>,
);
