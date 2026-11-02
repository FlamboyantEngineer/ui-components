import { useState, type ReactNode } from 'react';
import { Button } from '../../src/components/button/button.js';
import { CodeEditor } from '../../src/components/code-editor/code-editor.js';
import { Modal, ModalTrigger } from '../../src/components/modal/modal.js';
import { SearchField } from '../../src/components/search-field/search-field.js';
import { SelectField } from '../../src/components/select-field/select-field.js';
import { Table } from '../../src/components/table/table.js';

const completions = [{ label: 'fruit.count' }, { label: 'fruit.ripe' }];

/** A listbox button owns its picker keys without moving or selecting its table cell. */
export function PickerCell() {
  return (
    <div data-lab-demo="picker-cell">
      <Table
        aria-label="Fruit sizes"
        selectionMode="multiple"
        columns={[
          { id: 'name', header: 'Name', isRowHeader: true, renderCell: (row) => row.name },
          {
            id: 'size',
            header: 'Size',
            renderCell: (row) => (
              <SelectField
                label={`${row.name} size`}
                defaultValue="small"
                options={[
                  { id: 'small', label: 'Small' },
                  { id: 'large', label: 'Large' },
                ]}
              />
            ),
          },
        ]}
        rows={[
          { id: 'apple', name: 'Apple' },
          { id: 'banana', name: 'Banana' },
        ]}
      />
    </div>
  );
}

/** The host keeps a cell editor's value outside the table's collection. */
export function CompletingCell() {
  const [value, setValue] = useState('');
  return (
    <div data-lab-demo="completing-cell">
      <Table<{ id: string; source: ReactNode }>
        aria-label="Expressions"
        columns={[{ id: 'source', header: 'Expression', renderCell: (row) => row.source }]}
        rows={[
          {
            id: 'one',
            source: (
              <CodeEditor
                variant="surface"
                aria-label="Cell expression"
                value={value}
                onChange={setValue}
                completions={completions}
              />
            ),
          },
        ]}
      />
      <output aria-label="Expression value">{value}</output>
    </div>
  );
}

/** The filter owns editing keys; its header sorts and the enclosing modal keeps its shortcut. */
export function HeaderFilter() {
  const [query, setQuery] = useState('');
  const [saved, setSaved] = useState(0);
  const [sorted, setSorted] = useState(0);
  return (
    <div data-lab-demo="header-filter">
      <ModalTrigger>
        <Button>Filter fruit</Button>
        <Modal
          title="Filter fruit"
          primaryAction={{
            label: 'Apply',
            onPress: (close) => {
              setSaved((count) => count + 1);
              close();
            },
          }}
        >
          <Table
            aria-label="Filtered fruit"
            onSortChange={() => setSorted((count) => count + 1)}
            columns={[
              {
                id: 'name',
                header: <SearchField label="Fruit query" value={query} onChange={setQuery} />,
                allowsSorting: true,
                renderCell: (row) => row.name,
              },
            ]}
            rows={[{ id: 'one', name: 'Apple' }].filter((row) =>
              row.name.toLowerCase().includes(query.toLowerCase()),
            )}
          />
        </Modal>
      </ModalTrigger>
      <output aria-label="Applied filters">{saved}</output>
      <output aria-label="Header sorts">{sorted}</output>
    </div>
  );
}
