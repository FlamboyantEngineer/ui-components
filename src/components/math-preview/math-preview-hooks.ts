import { createHooks } from '../../core/hooks.js';

export const mathPreviewHooks = createHooks('math-preview', ['math', 'pending', 'error', 'source']);

export const mathFieldHooks = createHooks('math-field', ['editor', 'preview', 'status']);
