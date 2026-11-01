'use client';

// Whether the dialog around some content is still entering, for content that takes focus itself.

import { createContext } from 'react';

/**
 * `true` while the enclosing dialog is entering, `false` once it has entered, and `undefined`
 * outside a dialog that publishes it. A control that focuses itself on mount waits until it is
 * `false`, so focus does not scroll the panel and cut its entrance short.
 */
export const DialogEnteringContext = createContext<boolean | undefined>(undefined);
