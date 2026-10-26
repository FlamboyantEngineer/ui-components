import { type ReactNode } from 'react';
import { type FieldControlProps, type FieldState } from '../field/field.js';
import { type ChoiceGroupProps } from './choice-group.js';
interface ChoiceBoxProps {
    control: FieldControlProps;
    state: FieldState<string | null | string[]>;
    config: Pick<ChoiceGroupProps, 'name' | 'orientation' | 'selectAllLabel'>;
    children: ReactNode;
}
export declare function ChoiceBox({ control, state, config, children }: ChoiceBoxProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=choice-box.d.ts.map