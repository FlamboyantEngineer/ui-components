import { type CompositionEvent } from 'react';
type TextControl = HTMLInputElement | HTMLTextAreaElement;
export interface InputTransformOptions {
    /** Rewrites the control's text after an edit; without it every edit goes through as typed. */
    transform: ((text: string) => string) | undefined;
    /** The value before the edit: an edit the transform reduces to it changes nothing. */
    value: string;
    /** Takes the edited value. */
    setValue: (value: string) => void;
}
export interface InputTransform {
    /** Publishes the control, whose caret the transform keeps. */
    ref: (node: TextControl | null) => void;
    /** Takes the control's text after each edit. */
    onChange: (text: string) => void;
    onCompositionStart: () => void;
    onCompositionEnd: (event: CompositionEvent<TextControl>) => void;
}
/**
 * Runs each typed, pasted or dropped edit through `transform` before it becomes the value, and puts
 * the caret after the same accepted characters: the transform of the text before the caret. An
 * input method composition goes through untouched and is transformed once it ends.
 */
export declare function useInputTransform({ transform, value, setValue, }: InputTransformOptions): InputTransform;
export {};
//# sourceMappingURL=use-input-transform.d.ts.map