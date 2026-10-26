import type { SlotRegistry } from '../../utils/slot-registry.js';
import type { FieldState } from './field-state.js';
type FieldSlots = SlotRegistry<'root' | 'control'>;
/** Whether the value has an error or is still being checked; a disabled field never blocks. */
export declare function isFieldBlocking(state: FieldState<unknown>): boolean;
/**
 * Registers the field with an enclosing form, and in the `native` behavior gives its control the
 * field's error as its custom validity. An `invalid` event (a native submit the browser blocked)
 * shows the field's validation; inside a form, the field's own message replaces the browser's. A
 * native reset puts the initial value back.
 */
export declare function useFieldFormBinding(state: FieldState<unknown>, slots: FieldSlots, label: string): void;
export {};
//# sourceMappingURL=field-form.d.ts.map