import { type ReactNode } from 'react';
import type { BaseProps } from '../../core/props.js';
export interface PropertyRowProps extends BaseProps {
    /** The property's name, beside its control. A text label takes part in filtering and is marked. */
    label: ReactNode;
    /** The id of the control the label names; the label is then a `<label>` for it. */
    htmlFor?: string | undefined;
    /** More words a query may match, such as the names of a strip's cells. */
    keywords?: readonly string[] | undefined;
    /** The unit after the control, such as `px`. */
    unit?: string | undefined;
    /** A short caption under the control. */
    hint?: ReactNode;
    /** Supporting text for the whole row. */
    description?: ReactNode;
    /** Buttons at the end of the row. */
    actions?: ReactNode;
    /** The value is set here rather than inherited; sections and cards around it show a mark. */
    isOverridden?: boolean | undefined;
    /** Shows an asterisk after the label. The control announces the requirement itself. */
    isRequired?: boolean | undefined;
    /** Puts the label above a large control that spans the row. */
    wide?: boolean | undefined;
    /** The property's value or editable field. */
    children?: ReactNode;
}
/**
 * One labelled property of a panel: the label, then the control with its unit and hint, a
 * description and actions. Under a query it hides, staying mounted, unless the enclosing path, its
 * label or its keywords hold every term.
 */
export declare function PropertyRow({ label, htmlFor, keywords, unit, hint, description, actions, isOverridden, isRequired, wide, children, className, id, ...rest }: PropertyRowProps): import("react").JSX.Element;
//# sourceMappingURL=property-row.d.ts.map