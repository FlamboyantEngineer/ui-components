import { type RecordLabelProps } from './record-label.js';
/**
 * An inline reference to a record: its label (icon, identifier and name), then the parts the caller
 * gives (version, kind, state), an optional remove button, and a preview on hover and focus. An
 * unavailable record shows only its label and the remove button.
 */
export declare function RecordChipParts({ identifier, name, icon, size, truncate, href, isExternal, unavailable, type, version, state, layout, preview, onRemove, className, ...rest }: RecordLabelProps): import("react").JSX.Element;
//# sourceMappingURL=record-chip-parts.d.ts.map