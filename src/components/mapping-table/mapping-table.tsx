'use client';

import { useMemo } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import type { UiStrings } from '../../core/strings.js';
import { Badge } from '../badge/badge.js';
import { readOwn } from '../../utils/read-own.js';
import { SelectField, type SelectFieldOption } from '../select-field/select-field.js';
import {
  readMappedTarget,
  suggestMapping,
  summarizeMapping,
  type MappingSummary,
  type MappingTableColumn,
  type MappingTableSuggest,
  type MappingTableTarget,
  type MappingTableValue,
} from './mapping.js';

export interface MappingTableProps extends RefProps<HTMLDivElement>, BaseProps, AriaLabellingProps {
  /** The source columns, one row each, in order. */
  columns: readonly MappingTableColumn[];
  /** The fields the columns can be imported into, in the order the choices list them. */
  targets: readonly MappingTableTarget[];
  /** The mapping, controlled. */
  value?: MappingTableValue | undefined;
  /** The mapping to start with, uncontrolled. Defaults to the suggested mapping. */
  defaultValue?: MappingTableValue | undefined;
  /** Called with the whole new mapping after each choice. */
  onChange?: ((value: MappingTableValue) => void) | undefined;
  /** Suggests each column's target; a choice that matches its suggestion is marked. */
  getSuggestion?: MappingTableSuggest | undefined;
  /** Shows the mapping with read-only choices. */
  isReadOnly?: boolean | undefined;
}

const hooks = createHooks('mapping-table', [
  'table',
  'row',
  'column',
  'samples',
  'sample',
  'target',
  'select',
  'suggested',
  'summary',
  'counts',
  'problem',
]);

function labelOf(items: readonly { id: string; label: string }[], id: string): string {
  return items.find((item) => item.id === id)?.label ?? id;
}

/** The warning of a column whose target other columns map to as well. */
function describeDuplicate(options: {
  column: string;
  target: string | null;
  summary: MappingSummary;
  columns: readonly MappingTableColumn[];
  targets: readonly MappingTableTarget[];
  strings: UiStrings;
}): string | null {
  const { column, target, summary, columns, targets, strings } = options;
  const sources = target === null ? undefined : readOwn(summary.duplicates, target);
  if (target === null || !sources) return null;
  const others = sources.filter((id) => id !== column).map((id) => labelOf(columns, id));
  return strings.duplicateTarget(labelOf(targets, target), others);
}

interface MappingRowProps {
  column: MappingTableColumn;
  target: string | null;
  isSuggested: boolean;
  /** The duplicate warning, shown as the choice's warning message. */
  warning: string | null;
  options: readonly SelectFieldOption[];
  isReadOnly: boolean;
  onChange: (target: string | null) => void;
}

/** One source column: its name, its samples and its choice of target. */
function MappingRow({
  column,
  target,
  isSuggested,
  warning,
  options,
  isReadOnly,
  onChange,
}: MappingRowProps) {
  const strings = useUiStrings();
  return (
    <tr
      {...hooks.slot('row', {
        mapped: target !== null,
        suggested: isSuggested,
        duplicate: warning !== null,
      })}
      data-key={column.id}
    >
      <th scope="row" {...hooks.slot('column')}>
        {column.label}
      </th>
      <td {...hooks.slot('samples')}>
        {column.samples?.map((sample, index) => (
          <span key={index} {...hooks.slot('sample')}>
            {sample}
          </span>
        ))}
      </td>
      <td {...hooks.slot('target')}>
        <SelectField
          className={hooks.slotClass('select')}
          label={strings.importColumnAs(column.label)}
          labelLayout="control-only"
          options={options}
          emptyLabel={strings.doNotImport}
          placeholder={strings.doNotImport}
          isReadOnly={isReadOnly}
          value={target}
          tracksChanges={false}
          validate={() => (warning ? { severity: 'warning', message: warning } : null)}
          onChange={(next) => onChange(next === null ? null : String(next))}
        />
        {isSuggested ? (
          <Badge size="sm" className={hooks.slotClass('suggested')}>
            {strings.suggestedTarget}
          </Badge>
        ) : null}
      </td>
    </tr>
  );
}

/** The counts of mapped and skipped columns, and the required targets left unmapped. */
function MappingSummaryView({
  summary,
  total,
  targets,
}: {
  summary: MappingSummary;
  total: number;
  targets: readonly MappingTableTarget[];
}) {
  const strings = useUiStrings();
  const mapped = strings.mappedColumns(summary.mappedCount, total);
  const counts =
    summary.skippedCount > 0
      ? strings.countsSummary(mapped, strings.skippedColumns(summary.skippedCount))
      : mapped;
  return (
    <div {...hooks.slot('summary')} role="status">
      <p {...hooks.slot('counts')}>{counts}</p>
      {summary.isComplete ? null : (
        <p {...hooks.slot('problem')}>
          {strings.unmappedRequiredTargets(
            summary.unmappedRequired.map((id) => labelOf(targets, id)),
          )}
        </p>
      )}
    </div>
  );
}

/**
 * Maps the columns of imported data to target fields: one row per source column with its name and
 * sample values, and a choice of target with a "Don't import" option. Suggested choices are marked,
 * a target chosen for several columns warns on each, and a summary counts the mapped and skipped
 * columns and names the required targets still unmapped. The mapping is plain data.
 */
export function MappingTable({
  columns,
  targets,
  value,
  defaultValue,
  onChange,
  getSuggestion,
  isReadOnly = false,
  className,
  'aria-label': ariaLabel,
  ...rest
}: MappingTableProps) {
  const strings = useUiStrings();
  const suggestions = useMemo(
    () => suggestMapping(columns, targets, getSuggestion),
    [columns, targets, getSuggestion],
  );
  const [mapping, setMapping] = useControllableState(value, defaultValue ?? suggestions, onChange);
  const summary = summarizeMapping(columns, targets, mapping);
  const options = targets.map((target) => ({
    id: target.id,
    label: target.label,
    description: target.isRequired ? strings.requiredTarget : undefined,
  }));
  const label = ariaLabel ?? (rest['aria-labelledby'] ? undefined : strings.columnMapping);
  return (
    <div
      {...rest}
      {...hooks.root({ className, props: rest, data: { complete: summary.isComplete } })}
      role="group"
      aria-label={label}
    >
      <table {...hooks.slot('table')}>
        <thead>
          <tr>
            <th scope="col">{strings.sourceColumn}</th>
            <th scope="col">{strings.sampleValues}</th>
            <th scope="col">{strings.importAs}</th>
          </tr>
        </thead>
        <tbody>
          {columns.map((column) => {
            const target = readMappedTarget(mapping, column.id, targets);
            return (
              <MappingRow
                key={column.id}
                column={column}
                target={target}
                isSuggested={target !== null && target === suggestions[column.id]}
                warning={describeDuplicate({
                  column: column.id,
                  target,
                  summary,
                  columns,
                  targets,
                  strings,
                })}
                options={options}
                isReadOnly={isReadOnly}
                onChange={(next) => setMapping({ ...mapping, [column.id]: next })}
              />
            );
          })}
        </tbody>
      </table>
      <MappingSummaryView summary={summary} total={columns.length} targets={targets} />
    </div>
  );
}

export { suggestMapping, summarizeMapping } from './mapping.js';
export type {
  MappingSummary,
  MappingTableColumn,
  MappingTableSuggest,
  MappingTableTarget,
  MappingTableValue,
} from './mapping.js';
