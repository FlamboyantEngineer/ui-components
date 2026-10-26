import { type FieldControlProps, type FieldState } from '../field/field.js';
import type { NumberControlConfig } from './number-field.js';
import { type NumberSteps } from './number-field-parts.js';
interface DecimalControlProps {
    state: FieldState<number | null>;
    control: FieldControlProps;
    config: NumberControlConfig;
    steps: NumberSteps;
}
export declare function DecimalControl({ state, control, config, steps }: DecimalControlProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=decimal-control.d.ts.map