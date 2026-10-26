import { type CompletionListItem } from '../../completion-list/completion-list.js';
import { type MessageComposerTokenKind } from '../composer-message.js';
import type { MessageComposerCommand, MessageComposerMention } from './rich-message-composer.js';
/** A mention or command offered in the list. */
export interface RichCompletionItem extends CompletionListItem {
    id: string;
    kind: MessageComposerTokenKind;
    source: MessageComposerMention | MessageComposerCommand;
}
export interface RichCompletionsOptions {
    mentions: readonly MessageComposerMention[] | undefined;
    commands: readonly MessageComposerCommand[] | undefined;
    isEditable: boolean;
}
/**
 * The rich composer's completions: `@` opens the mentions and `/` the commands, at the start of a
 * line or after a space, filtered by the query typed after the trigger. While the list is open,
 * the arrows move the active option (wrapping), Enter or Tab insert it as a pill and Escape closes
 * it until the next edit or caret move. It opens only while the editor has focus.
 */
export declare function useRichCompletions(options: RichCompletionsOptions): {
    isOpen: boolean;
    kind: MessageComposerTokenKind | undefined;
    matches: RichCompletionItem[];
    activeItem: RichCompletionItem | undefined;
    listId: string;
    choose: (this: unknown, item: RichCompletionItem) => void;
    handleKeyDown: (event: KeyboardEvent) => boolean;
    close: () => void;
    setActiveKey: (key: string) => void;
    contentAttributes: {
        readonly 'aria-autocomplete': "list";
        readonly 'aria-haspopup': "listbox";
        readonly 'aria-controls': string | undefined;
        readonly 'aria-activedescendant': string | undefined;
    };
};
//# sourceMappingURL=use-rich-completions.d.ts.map