import { useState } from 'react';
import { Checkbox } from '../../src/components/checkbox/checkbox.js';
import { InlineError } from '../../src/components/inline-error/inline-error.js';
import { Grid, Stack } from '../../src/components/layout/layout.js';
import { NumberField } from '../../src/components/number-field/number-field.js';
import { SelectField } from '../../src/components/select-field/select-field.js';
import { Table } from '../../src/components/table/table.js';

export function DisplayCollectionRecipe() {
  const [compact, setCompact] = useState(false);
  return (
    <Stack space="md">
      <Checkbox isSelected={compact} onChange={setCompact}>
        Compact rows
      </Checkbox>
      <SelectField
        label="Order by"
        defaultValue="title"
        options={[
          { id: 'title', label: 'Title' },
          { id: 'date', label: 'Date' },
        ]}
      />
      <output>{compact ? 'Compact' : 'Comfortable'} density</output>
    </Stack>
  );
}

export { ViewCollectionRecipe } from './composition-collections-views.js';

const mappingRows = [
  { id: 'label', source: 'Label' },
  { id: 'summary', source: 'Summary' },
  { id: 'details', source: 'Details' },
];

/** Suggestions and validation are ordinary host projections over the selected targets. */
export function MappingCollectionRecipe() {
  const [mapping, setMapping] = useState<Record<string, string | null>>({
    label: 'name',
    summary: 'name',
    details: null,
  });
  const chosen = Object.values(mapping).filter((value) => value !== null);
  const duplicate = (target: string | null | undefined) =>
    target != null && chosen.filter((value) => value === target).length > 1;
  const complete = mappingRows.every(
    (row) => mapping[row.id] != null && !duplicate(mapping[row.id]),
  );
  return (
    <Stack space="md">
      <Table
        aria-label="Column assignments"
        rows={mappingRows}
        columns={[
          { id: 'source', header: 'Source' },
          {
            id: 'target',
            header: 'Destination',
            renderCell: (row) => (
              <SelectField
                label={`Destination for ${row.source}`}
                value={mapping[row.id] ?? null}
                emptyLabel="Unmapped"
                options={[
                  { id: 'name', label: 'Name' },
                  { id: 'description', label: 'Description' },
                  { id: 'notes', label: 'Notes' },
                ]}
                errorMessage={
                  duplicate(mapping[row.id]) ? 'Destination is used more than once.' : undefined
                }
                onChange={(key) =>
                  setMapping((current) => ({
                    ...current,
                    [row.id]: key === null ? null : String(key),
                  }))
                }
              />
            ),
          },
        ]}
      />
      {complete ? (
        <output>All sources mapped.</output>
      ) : (
        <InlineError tone="warning">Choose a unique destination for every source.</InlineError>
      )}
    </Stack>
  );
}

const accessRows = [
  { id: 'Reviewers', name: 'Reviewers', inherited: false },
  { id: 'Editors', name: 'Editors', inherited: false },
  { id: 'Guests', name: 'Guests', inherited: true },
];
const rights = ['read', 'write'] as const;
const editableGrants = accessRows.flatMap((row) =>
  rights
    .filter((right) => !(row.inherited && right === 'read'))
    .map((right) => `${row.id}:${right}`),
);

/** Inherited grants and group toggles are host policy over independently accessible checkboxes. */
export function PermissionCollectionRecipe() {
  const [grants, setGrants] = useState<Set<string>>(new Set(['Editors:read']));
  const all = editableGrants.every((key) => grants.has(key));
  const some = editableGrants.some((key) => grants.has(key));
  return (
    <Stack space="md">
      <Checkbox
        isSelected={all}
        isIndeterminate={some && !all}
        onChange={(checked) => setGrants(new Set(checked ? editableGrants : []))}
      >
        All editable permissions
      </Checkbox>
      <Table
        aria-label="Access choices"
        rows={accessRows}
        columns={[
          { id: 'name', header: 'Group' },
          ...rights.map((right) => ({
            id: right,
            header: right === 'read' ? 'Read' : 'Write',
            renderCell: (row: (typeof accessRows)[number]) => {
              const inherited = row.inherited && right === 'read';
              const key = `${row.id}:${right}`;
              return (
                <Checkbox
                  aria-label={`${row.name} can ${right}${inherited ? ' (inherited)' : ''}`}
                  isReadOnly={inherited}
                  isSelected={inherited || grants.has(key)}
                  onChange={(checked) =>
                    setGrants((current) => {
                      const next = new Set(current);
                      if (checked) next.add(key);
                      else next.delete(key);
                      return next;
                    })
                  }
                />
              );
            },
          })),
        ]}
      />
      <p>Guests inherit Read; the host keeps that grant read-only.</p>
    </Stack>
  );
}

export function ConstraintCollectionRecipe() {
  const [minimum, setMinimum] = useState<number | null>(0);
  const [maximum, setMaximum] = useState<number | null>(100);
  const invalid = minimum !== null && maximum !== null && minimum > maximum;
  return (
    <Grid columns="fit" minColumnWidth="sm" space="md">
      <NumberField label="Minimum" value={minimum} onChange={setMinimum} />
      <NumberField
        label="Maximum"
        value={maximum}
        onChange={setMaximum}
        errorMessage={invalid ? 'Maximum must be at least minimum.' : undefined}
      />
    </Grid>
  );
}
