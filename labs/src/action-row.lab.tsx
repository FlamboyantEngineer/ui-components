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
      icon: 'expand',
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
              { id: 'rename', label: 'Rename', icon: 'edit', shortcut: 'F2' },
              { id: 'duplicate', label: 'Duplicate' },
              { id: 'export', label: 'Export', icon: 'upload', description: 'As PDF' },
              { id: 'share', label: 'Share', isDisabled: true },
              { type: 'separator', id: 'rule' },
              { id: 'delete', label: 'Delete', icon: 'delete', tone: 'danger' },
            ],
          },
          {
            verb: 'custom',
            icon: 'sort-ascending',
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
            { verb: 'custom', icon: 'help', label: 'Help', onPress: noop },
            { verb: 'more', onPress: noop },
            { verb: 'refresh', onPress: noop },
            { verb: 'add', onPress: noop },
            { verb: 'custom', icon: 'search', label: 'Search', onPress: noop },
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
  </>,
);
