import { type ReactElement, type ReactNode } from 'react';
import type { BaseProps } from '../../core/props.js';
import { type ChatMessageCommandProps } from './message-commands.js';
export interface ChatMessageActionsMenuProps extends BaseProps, ChatMessageCommandProps {
    /**
     * Draws the message, given its action bar (`null` without commands) for the message's `actions`.
     * The element it returns takes event handlers and a ref, as `ChatMessage` does.
     */
    children: (actions: ReactNode) => ReactElement;
    /** Names the menu. Defaults to the provider's `messageActions` string. */
    'aria-label'?: string | undefined;
}
/**
 * Offers a message's commands in a context menu, on a secondary click, a long touch, the Context
 * Menu key or Shift+F10 on the message, and hands the message its action bar. The menu and the bar
 * share one state: a rating, a copy or an overlay opened from either shows in both. Overlays opened
 * from the menu are placed against the message.
 */
export declare function ChatMessageActionsMenu(props: ChatMessageActionsMenuProps): import("react").JSX.Element;
//# sourceMappingURL=chat-message-actions-menu.d.ts.map