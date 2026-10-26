import { createHooks } from '../../core/hooks.js';

/** The hooks of a tool call, shared by its modules. */
export const toolCallHooks = createHooks('chat-tool-call', [
  'disclosure',
  'heading',
  'status-glyph',
  'summary',
  'label',
  'status',
  'duration',
  'badge',
  'body',
  'part',
  'part-header',
  'part-title',
  'copy',
  'json',
  'empty',
  'error',
  'approval',
  'prompt',
  'actions',
  'action',
  'deny-form',
  'reason',
  'decision',
]);
