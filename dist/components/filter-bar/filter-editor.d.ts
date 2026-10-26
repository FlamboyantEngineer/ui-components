import { type FilterCondition, type FilterField } from './filter-model.js';
/** Whether the editor's controls draw their labels or are only named by them. */
export type FilterEditorLabelLayout = 'label-control' | 'control-only';
/** The parts of a condition editor the host component gives its own slot classes. */
export type FilterEditorSlot = 'operator' | 'value';
export interface FilterConditionFieldsProps {
    field: FilterField;
    condition: FilterCondition;
    onChange: (condition: FilterCondition) => void;
    labelLayout: FilterEditorLabelLayout;
    /** The host component's slot class for each part. */
    slotClass: (slot: FilterEditorSlot) => string;
}
/**
 * The operator and value of one condition: a select of the field's operators (left out when the
 * field offers one), then the value control its operator takes. Each change reports a new condition.
 */
export declare function FilterConditionFields(props: FilterConditionFieldsProps): import("react").JSX.Element;
//# sourceMappingURL=filter-editor.d.ts.map