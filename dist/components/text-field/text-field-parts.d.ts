import { type CompositionEvent, type KeyboardEvent, type ReactNode } from 'react';
import { type HookProps } from '../../core/hooks.js';
import type { CompletionInputAttributes } from '../completion-list/completion-list.js';
import { type AutoGrowOptions } from '../../utils/use-auto-grow.js';
export declare const textFieldHooks: import("../../core/hooks.js").ComponentHooks<"input" | "start" | "end" | "count" | "group" | "box" | "completions" | "reveal">;
export interface RevealButtonProps {
    /** The field's label, which names the button. */
    label: string;
    isRevealed: boolean;
    isDisabled: boolean;
    onChange(isRevealed: boolean): void;
}
export interface TextFieldFrameProps {
    startAdornment: ReactNode;
    endAdornment: ReactNode;
    /** The reveal button of a masked field, or `null`. */
    reveal: RevealButtonProps | null;
    /** The input or text area. */
    children: ReactNode;
}
/** The input's own props: its hooks, the hint, the field's edit handlers and its completion list's attributes. */
export type TextFieldInputProps = HookProps & Partial<CompletionInputAttributes> & {
    placeholder: string | undefined;
    onFocus: () => void;
    onBlur: () => void;
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
    onCompositionStart: () => void;
    onCompositionEnd: (event: CompositionEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onClick?: (() => void) | undefined;
    onKeyUp?: ((event: KeyboardEvent<HTMLElement>) => void) | undefined;
};
export interface TextFieldAreaProps extends TextFieldInputProps, AutoGrowOptions {
    /** Publishes the text area to the field. */
    controlRef: (node: HTMLElement | null) => void;
}
/**
 * The input alone, or with adornments or a reveal button a group around them all, which the host
 * frames as one box.
 */
export declare function TextFieldFrame({ startAdornment, endAdornment, reveal, children, }: TextFieldFrameProps): string | number | bigint | boolean | Iterable<ReactNode> | Promise<string | number | bigint | boolean | import("react").ReactPortal | import("react").ReactElement<unknown, string | import("react").JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | import("react").JSX.Element | null | undefined;
/** The description, followed by the character count when there is one, so the count describes the control too. */
export declare function withCharacterCount(description: ReactNode, { count, maxLength }: {
    count: number | null;
    maxLength: number | undefined;
}): ReactNode;
/** The text area, at least `minRows` tall, growing with its text when a row limit is set. */
export declare function TextFieldArea({ controlRef, minRows, maxRows, value, ...rest }: TextFieldAreaProps): import("react").JSX.Element;
export interface TextFieldControlProps extends Omit<AutoGrowOptions, 'value'> {
    input: TextFieldInputProps;
    multiline: boolean;
    /** The text the control shows. */
    value: string;
    /** Publishes the input or text area to the field. */
    controlRef: (node: HTMLElement | null) => void;
}
/** The text area of a multiline field, else the input. */
export declare function TextFieldControl({ input, multiline, controlRef, ...grow }: TextFieldControlProps): import("react").JSX.Element;
//# sourceMappingURL=text-field-parts.d.ts.map