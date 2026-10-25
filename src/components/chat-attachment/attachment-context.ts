// How a Chat Attachment List hears about its attachments' remove buttons.

import { createContext } from 'react';
import type { RemovalFocus } from '../../utils/use-removal-focus.js';

/** The removal focus of the list an attachment is in; `null` outside a list. */
export const AttachmentRemovalContext = createContext<RemovalFocus | null>(null);
