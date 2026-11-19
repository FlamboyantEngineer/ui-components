import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Dialog } from '../../src/components/dialog/dialog.js';
import { Cluster, Stack } from '../../src/components/layout/layout.js';
import { ListView, ListViewItem, ListViewSection } from '../../src/components/list-row/index.js';
import { SearchField } from '../../src/components/search-field/search-field.js';
import { Tree } from '../../src/components/tree/tree.js';
import type { Key } from '../../src/core/props.js';

/** Host groups its own events; the collection owns keyboard navigation and load-more rendering. */
export function ActivityCollectionRecipe() {
  return (
    <ListView aria-label="Recent activity" divided>
      <ListViewSection title="June 12">
        <ListViewItem id="created" title="Avery created a draft" meta="09:15" />
        <ListViewItem id="updated" title="Morgan updated the title" meta="10:40" />
      </ListViewSection>
    </ListView>
  );
}

/** Before/after content is host data rather than a library change schema. */
export function ChangeCollectionRecipe() {
  return (
    <Stack space="sm" divided>
      <Cluster justify="between">
        <strong>Title</strong>
        <span>
          <del>Notes</del> → <ins>Field notes</ins>
        </span>
      </Cluster>
      <Cluster justify="between">
        <strong>Status</strong>
        <span>
          <del>Draft</del> → <ins>Reviewed</ins>
        </span>
      </Cluster>
    </Stack>
  );
}

/** Selection survives host updates; ListView carries keyboard focus when a row is removed. */
export function NotificationCollectionRecipe() {
  const [items, setItems] = useState(['Review ready', 'Export finished']);
  return (
    <ListView aria-label="Updates" selectionMode="single" renderEmptyState={() => 'No updates'}>
      {items.map((title) => (
        <ListViewItem
          key={title}
          id={title}
          title={title}
          trailing={
            <Button
              size="sm"
              aria-label={`Dismiss ${title}`}
              onPress={() => setItems((current) => current.filter((item) => item !== title))}
            >
              Dismiss
            </Button>
          }
        />
      ))}
    </ListView>
  );
}

interface RevisionEntry {
  id: string;
  name: string;
  children?: RevisionEntry[];
}

function renameRevision(
  entries: readonly RevisionEntry[],
  id: string,
  name: string,
): RevisionEntry[] {
  return entries.map((entry) => ({
    ...entry,
    name: entry.id === id ? name : entry.name,
    children: entry.children ? renameRevision(entry.children, id, name) : undefined,
  }));
}

/** The host owns revision data, comparison and restore policy; Dialog owns async action feedback. */
export function RevisionCollectionRecipe() {
  const [selected, setSelected] = useState<Set<Key>>(new Set());
  const [restoring, setRestoring] = useState(false);
  const [current, setCurrent] = useState('Second draft');
  const [comparison, setComparison] = useState('');
  const [filter, setFilter] = useState('');
  const [expanded, setExpanded] = useState<Set<Key>>(new Set());
  const [versions, setVersions] = useState<RevisionEntry[]>([
    { id: 'Second draft', name: 'Second draft', children: [{ id: 'Autosave', name: 'Autosave' }] },
    { id: 'First draft', name: 'First draft' },
  ]);
  return (
    <Stack space="md">
      <Cluster>
        <Button
          isDisabled={selected.size !== 2}
          onPress={() => setComparison([...selected].join(' / '))}
        >
          Compare selected
        </Button>
        <Button isDisabled={selected.size !== 1} onPress={() => setRestoring(true)}>
          Restore selected
        </Button>
      </Cluster>
      <SearchField label="Filter revisions" value={filter} onChange={setFilter} />
      <Tree
        aria-label="Revisions"
        items={versions}
        getTextValue={(entry) => entry.name}
        getSection={() => ({ id: 'june-12', label: 'June 12' })}
        filterText={filter}
        expandedKeys={expanded}
        onExpandedChange={setExpanded}
        selectionMode="multiple"
        selectedKeys={selected}
        onSelectionChange={(keys) =>
          setSelected(keys === 'all' ? new Set(['Second draft', 'First draft', 'Autosave']) : keys)
        }
        onRename={(entry, name) =>
          setVersions((current) => renameRevision(current, entry.id, name))
        }
      />
      <output aria-live="polite">
        Current: {current}
        {comparison ? `; Comparing ${comparison}` : ''}
      </output>
      <Dialog
        title="Restore revision"
        description="Replace the current draft with the selected revision?"
        isOpen={restoring}
        onOpenChange={setRestoring}
        cancelAction={{}}
        primaryAction={{
          label: 'Restore',
          onPress: async (close) => {
            await Promise.resolve();
            setCurrent(String([...selected][0]));
            close();
          },
        }}
      />
    </Stack>
  );
}
