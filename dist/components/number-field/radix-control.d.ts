import { type FieldControlProps, type FieldState } from '../field/field.js';
import type { NumberControlConfig } from './number-field.js';
import { type NumberSteps } from './number-field-parts.js';
import { type NumberFieldRadix } from './radix-number.js';
interface RadixControlProps {
    state: FieldState<number | null>;
    control: FieldControlProps;
    radix: NumberFieldRadix;
    config: NumberControlConfig;
    steps: NumberSteps;
}
/** A radix spinbutton on a text-field building block; numeric value and stepping stay base independent. */
export declare function RadixControl(props: RadixControlProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=radix-control.d.ts.map