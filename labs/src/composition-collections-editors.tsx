import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { CodeEditor } from '../../src/components/code-editor/code-editor.js';
import { Cluster, Stack } from '../../src/components/layout/layout.js';
import { Modal } from '../../src/components/modal/modal.js';
import { SearchField } from '../../src/components/search-field/search-field.js';
import { SelectField } from '../../src/components/select-field/select-field.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import { Tree } from '../../src/components/tree/tree.js';
import type { Key } from '../../src/core/props.js';

/** Source selection and retrieval belong to the host; CodeEditor supplies editing and diagnostics. */
export function SnippetCollectionRecipe() {
  const [source, setSource] = useState('');
  return (
    <Stack space="md">
      <SelectField
        label="Example source"
        options={[{ id: 'greeting', label: 'Greeting' }]}
        onChange={(key) => {
          if (key === 'greeting') setSource('const greeting = "Hello";');
        }}
      />
      <CodeEditor label="Source" language="javascript" value={source} onChange={setSource} />
    </Stack>
  );
}

/** The host supplies the query language and execution; editor completion remains generic. */
export function QueryCollectionRecipe() {
  const [query, setQuery] = useState('select title from entries');
  const [result, setResult] = useState('');
  return (
    <Stack space="md">
      <CodeEditor
        label="Query"
        language="sql"
        value={query}
        onChange={setQuery}
        onSubmit={(value) => setResult(`Submitted: ${value}`)}
      />
      <Button onPress={() => setResult(`Submitted: ${query}`)}>Run query</Button>
      <output aria-label="Query result" aria-live="polite">
        {result}
      </output>
    </Stack>
  );
}

/** Tree supplies filtering, selection and inline F2 rename; creation policy stays here. */
export function FolderCollectionRecipe() {
  const [items, setItems] = useState([
    { id: 'drafts', name: 'Drafts' },
    { id: 'archive', name: 'Archive' },
  ]);
  const [selected, setSelected] = useState<Set<Key>>(new Set());
  const [filter, setFilter] = useState('');
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  return (
    <Stack space="md">
      <Cluster>
        <Button
          onPress={() => {
            setName('');
            setCreating(true);
          }}
        >
          Create collection
        </Button>
        <Button
          isDisabled={selected.size === 0}
          onPress={() => {
            setItems((current) => current.filter((item) => !selected.has(item.id)));
            setSelected(new Set());
          }}
        >
          Remove selected
        </Button>
      </Cluster>
      <SearchField label="Filter collections" value={filter} onChange={setFilter} />
      <Tree
        aria-label="Collections"
        items={items}
        getTextValue={(item) => item.name}
        selectionMode="single"
        selectedKeys={selected}
        onSelectionChange={(keys) =>
          setSelected(keys === 'all' ? new Set(items.map((item) => item.id)) : keys)
        }
        filterText={filter}
        onRename={async (item, next) => {
          await Promise.resolve();
          if (items.some((entry) => entry.id !== item.id && entry.name === next))
            throw new Error('That name is already used.');
          setItems((current) =>
            current.map((entry) => (entry.id === item.id ? { ...entry, name: next } : entry)),
          );
        }}
      />
      <Modal
        title="Create collection"
        isOpen={creating}
        onOpenChange={setCreating}
        cancelAction={{}}
        primaryAction={{
          label: 'Create',
          isDisabled: !name.trim(),
          onPress: async (close) => {
            await Promise.resolve();
            const next = name.trim();
            if (items.some((entry) => entry.name === next))
              throw new Error('That name is already used.');
            setItems((current) => [...current, { id: next, name: next }]);
            close();
          },
        }}
      >
        <TextField label="Collection name" value={name} onChange={setName} autoFocus />
      </Modal>
    </Stack>
  );
}
