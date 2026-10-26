import { createHooks } from '../../core/hooks.js';
/** The transcript's hooks, shared by the modules that draw its parts. */
export const transcriptHooks = createHooks('chat-transcript', [
    'log',
    'feed',
    'empty',
    'history',
    'spacer',
    'jump',
    'unread',
    'announcer',
]);
//# sourceMappingURL=transcript-hooks.js.map