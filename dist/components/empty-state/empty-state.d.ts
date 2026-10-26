import type { ReactNode } from 'react';
import type { BaseProps, NativeProps, Size } from '../../core/props.js';
import { type IconSource } from '../icon/icon.js';
import type { HeadingLevel } from '../section-header/section-header.js';
/** `empty`: loaded with nothing to show. `loading`: being fetched. `error`: could not load. */
export type EmptyStateVariant = 'empty' | 'loading' | 'error';
export type EmptyStateSize = Extract<Size, 'sm' | 'md'>;
export interface EmptyStateProps extends BaseProps, Pick<NativeProps<'section'>, 'hidden'> {
    /** One line on what is missing, what is loading or what the reader can do next. */
    description: ReactNode;
    /** An optional heading over the description. */
    title?: ReactNode;
    /** What the notice stands for. Defaults to `empty`. */
    variant?: EmptyStateVariant | undefined;
    /** `sm` for dense containers, `md` (the default) elsewhere. */
    size?: EmptyStateSize | undefined;
    /** The title's heading level. Defaults to 3. */
    headingLevel?: HeadingLevel | undefined;
    /** A decorative illustration or glyph over the text: a built-in glyph name or any node. */
    icon?: IconSource;
    /** Calls to action under the description, such as a button that adds the first item. */
    actions?: ReactNode;
}
/**
 * The notice a collection, panel or section shows in place of its content while it loads, when it
 * has nothing to show, or when it could not load.
 */
export declare function EmptyState({ description, title, variant, size, headingLevel, icon, actions, className, ...rest }: EmptyStateProps): import("react").JSX.Element;
//# sourceMappingURL=empty-state.d.ts.map