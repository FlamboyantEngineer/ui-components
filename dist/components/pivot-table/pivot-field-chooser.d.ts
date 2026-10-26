import type { PivotLayout } from '../../utils/pivot.js';
import { type PivotTableField } from './pivot-columns.js';
interface PivotFieldChooserProps {
    fields: readonly PivotTableField[];
    layout: PivotLayout;
    onLayoutChange: (layout: PivotLayout) => void;
}
/**
 * The field chooser: a board whose columns are the unused fields, the row fields, the column fields
 * and the values, its cards moving between them by drag and drop or Alt+Arrow keys. A value's card
 * picks its aggregation.
 */
export declare function PivotFieldChooser({ fields, layout, onLayoutChange }: PivotFieldChooserProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=pivot-field-chooser.d.ts.map