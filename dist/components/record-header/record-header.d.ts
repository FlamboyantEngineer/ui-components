import type { ReactNode } from 'react';
import type { BaseProps } from '../../core/props.js';
import type { IconSource } from '../icon/icon.js';
import { type HeadingLevel } from '../section-header/section-header.js';
export interface RecordHeaderProps extends BaseProps {
    /** The record's identifier, such as `REQ-12`, shown with a button that copies it. */
    identifier: string;
    /** A glyph name or icon node for the record's kind, before the identifier. Decorative. */
    icon?: IconSource;
    /** The record's title. */
    title: string;
    /**
     * Makes the title editable in place and saves a changed title. A returned promise keeps the
     * editor pending until it settles; a rejection keeps it open with the rejection's message.
     */
    onTitleChange?: ((title: string) => void | Promise<unknown>) | undefined;
    /** Shown while the editable title is empty. */
    titlePlaceholder?: ReactNode;
    /** The title's heading level. Defaults to one below the enclosing section's, else 3. */
    headingLevel?: HeadingLevel | undefined;
    /** The record's state, such as a `Badge`, a `StatusLight` or a `TransitionMenu`. */
    status?: ReactNode;
    /** Metadata entries, such as an `Attribution`, joined into one `MetaLine`. */
    meta?: readonly ReactNode[] | undefined;
    /** The record's actions, such as an `ActionRow`. */
    actions?: ReactNode;
}
/**
 * A record's title row: its kind icon and identifier with a copy button, its title, editable in
 * place, its state, a line of metadata and its actions.
 */
export declare function RecordHeader({ identifier, icon, title, onTitleChange, titlePlaceholder, headingLevel, status, meta, actions, className, id, ...rest }: RecordHeaderProps): import("react").JSX.Element;
//# sourceMappingURL=record-header.d.ts.map