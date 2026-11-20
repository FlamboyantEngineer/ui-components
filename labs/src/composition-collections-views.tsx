import { useRef, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Checkbox } from '../../src/components/checkbox/checkbox.js';
import { Dialog } from '../../src/components/dialog/dialog.js';
import { Cluster, Stack } from '../../src/components/layout/layout.js';
import { Menu, MenuPopover, MenuTrigger } from '../../src/components/menu/menu.js';
import { SelectField } from '../../src/components/select-field/select-field.js';
import { TextField } from '../../src/components/text-field/text-field.js';

const initialViews = [
  { id: 'list', label: 'List', compact: false },
  { id: 'grid', label: 'Grid', compact: true },
];

/** Saved snapshots and dirty policy belong to the host; controls supply keyboard and overlay behavior. */
export function ViewCollectionRecipe() {
  const [views, setViews] = useState(initialViews);
  const nextViewId = useRef(0);
  const [selected, setSelected] = useState('list');
  const view = views.find((entry) => entry.id === selected) ?? initialViews[0];
  const [compact, setCompact] = useState(false);
  const [dialog, setDialog] = useState<'rename' | 'duplicate' | 'delete' | null>(null);
  const [name, setName] = useState('');
  const dirty = compact !== view?.compact;
  return (
    <Stack space="md">
      <Cluster>
        <SelectField
          label="Saved view"
          value={selected}
          options={views}
          onChange={(key) => {
            const next = views.find((entry) => entry.id === key);
            if (next) {
              setSelected(next.id);
              setCompact(next.compact);
            }
          }}
        />
        <Button
          isDisabled={!dirty}
          onPress={() =>
            setViews((current) =>
              current.map((entry) => (entry.id === selected ? { ...entry, compact } : entry)),
            )
          }
        >
          Save view
        </Button>
        <Button isDisabled={!dirty} onPress={() => setCompact(view?.compact ?? false)}>
          Reset view
        </Button>
        <MenuTrigger>
          <Button>View actions</Button>
          <MenuPopover>
            <Menu
              aria-label="View actions"
              items={[
                { id: 'rename', label: 'Rename view' },
                { id: 'duplicate', label: 'Duplicate view' },
                { id: 'delete', label: 'Delete view', isDisabled: views.length === 1 },
              ]}
              onAction={(key) => {
                setName(key === 'duplicate' ? `${view?.label ?? ''} copy` : (view?.label ?? ''));
                if (key === 'rename' || key === 'duplicate' || key === 'delete') setDialog(key);
              }}
            />
          </MenuPopover>
        </MenuTrigger>
      </Cluster>
      <Checkbox isSelected={compact} onChange={setCompact}>
        Compact rows
      </Checkbox>
      <output aria-live="polite">
        Current view: {view?.label}
        {dirty ? ' (unsaved)' : ''}
      </output>
      <Dialog
        isDismissable={false}
        title={
          dialog === 'delete'
            ? 'Delete saved view'
            : dialog === 'duplicate'
              ? 'Duplicate saved view'
              : 'Rename saved view'
        }
        isOpen={dialog !== null}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
        cancelAction={{}}
        primaryAction={{
          label: dialog === 'delete' ? 'Delete' : 'Save',
          isDisabled: dialog !== 'delete' && !name.trim(),
          onPress: (close) => {
            if (dialog === 'delete') {
              const remaining = views.filter((entry) => entry.id !== selected);
              setViews(remaining);
              setSelected(remaining[0]?.id ?? '');
              setCompact(remaining[0]?.compact ?? false);
            } else if (dialog === 'duplicate') {
              const id = `saved-${nextViewId.current++}`;
              setViews((current) => [...current, { id, label: name.trim(), compact }]);
              setSelected(id);
            } else
              setViews((current) =>
                current.map((entry) =>
                  entry.id === selected ? { ...entry, label: name.trim() } : entry,
                ),
              );
            close();
          },
        }}
      >
        {dialog === 'delete' ? (
          <p>Delete {view?.label}?</p>
        ) : (
          <TextField label="View name" value={name} onChange={setName} autoFocus />
        )}
      </Dialog>
    </Stack>
  );
}
