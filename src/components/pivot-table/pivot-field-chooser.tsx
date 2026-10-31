'use client';

import { UiProvider, useUiStrings } from '../../core/provider.js';
import type { PivotAggregateName, PivotLayout } from '../../utils/pivot.js';
import { Board, type BoardColumn } from '../board/board.js';
import { SelectField } from '../select-field/select-field.js';
import { getValueLabel, type PivotTableField } from './pivot-columns.js';
import {
  applyFieldMove,
  createFieldCards,
  setValueAggregate,
  type PivotFieldCard,
} from './pivot-fields.js';
import { pivotTableHooks as hooks } from './pivot-table-hooks.js';

interface PivotFieldChooserProps {
  fields: readonly PivotTableField[];
  layout: PivotLayout;
  onLayoutChange: (layout: PivotLayout) => void;
}

const aggregates: readonly PivotAggregateName[] = ['sum', 'count', 'min', 'max', 'average'];

function FieldCard({
  card,
  layout,
  onLayoutChange,
}: Omit<PivotFieldChooserProps, 'fields'> & { card: PivotFieldCard }) {
  const strings = useUiStrings();
  const { value } = card;
  const aggregate = value?.value.aggregate ?? 'sum';
  return (
    <div {...hooks.slot('field', { zone: card.zone })}>
      <span {...hooks.slot('field-label')}>{card.field.label}</span>
      {value && typeof aggregate === 'string' ? (
        <SelectField
          className={hooks.slotClass('aggregate')}
          label={strings.pivotAggregationOf(card.field.label)}
          labelLayout="control-only"
          options={aggregates.map((id) => ({ id, label: strings.pivotAggregate(id) }))}
          value={aggregate}
          tracksChanges={false}
          onChange={(id) =>
            id === null
              ? undefined
              : onLayoutChange(setValueAggregate(layout, value.index, id as PivotAggregateName))
          }
        />
      ) : null}
    </div>
  );
}

/**
 * The field chooser: a board whose columns are the unused fields, the row fields, the column fields
 * and the values, its cards moving between them by drag and drop or Alt+Arrow keys. A value's card
 * picks its aggregation.
 */
export function PivotFieldChooser({ fields, layout, onLayoutChange }: PivotFieldChooserProps) {
  const strings = useUiStrings();
  const columns: BoardColumn[] = [
    { id: 'fields', title: strings.pivotFields },
    { id: 'rows', title: strings.pivotRows },
    { id: 'columns', title: strings.pivotColumns },
    { id: 'values', title: strings.pivotValues },
  ];
  const cards = createFieldCards(fields, layout);
  const labelOf = (card: PivotFieldCard) =>
    card.value ? getValueLabel(card.value.value, card.field, strings) : card.field.label;
  return (
    <UiProvider messages={{ noCards: strings.pivotNoFields }}>
      <Board
        className={hooks.slotClass('chooser')}
        aria-label={strings.pivotFieldChooser}
        columns={columns}
        items={cards}
        getColumn={(card) => card.zone}
        getTextValue={labelOf}
        renderCard={(card) => (
          <FieldCard card={card} layout={layout} onLayoutChange={onLayoutChange} />
        )}
        onMove={(move) => onLayoutChange(applyFieldMove(layout, fields, move))}
      />
    </UiProvider>
  );
}
