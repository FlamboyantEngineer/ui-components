import { type KeyboardEvent, type MouseEvent, type PointerEvent, type Ref, type RefObject } from 'react';
import type { MenuController } from './menu-controller.js';
/** The props a context menu target receives; its own values are called first. */
export interface ContextMenuTargetProps {
    onContextMenu?: ((event: MouseEvent<HTMLElement>) => void) | undefined;
    onKeyDown?: ((event: KeyboardEvent<HTMLElement>) => void) | undefined;
    onPointerDown?: ((event: PointerEvent<HTMLElement>) => void) | undefined;
    onPointerMove?: ((event: PointerEvent<HTMLElement>) => void) | undefined;
    onPointerUp?: ((event: PointerEvent<HTMLElement>) => void) | undefined;
    onPointerCancel?: ((event: PointerEvent<HTMLElement>) => void) | undefined;
    ref?: Ref<HTMLElement> | undefined;
}
export interface ContextMenuTargetOptions {
    controller: MenuController;
    isDisabled: boolean;
    /** The target's own props, which keep working. */
    own: ContextMenuTargetProps;
    /** Receives the target element. */
    targetRef: RefObject<HTMLElement | null>;
}
/**
 * The handlers and ref that make an element a context menu target: a secondary click opens the
 * menu at the pointer, the Context Menu key or Shift+F10 below the element, a long touch at the
 * touch point. A secondary click or long touch on a text control inside the target keeps the
 * browser's own menu, which edits the text.
 */
export declare function useContextMenuTarget(options: ContextMenuTargetOptions): ContextMenuTargetProps;
//# sourceMappingURL=context-menu-target.d.ts.map