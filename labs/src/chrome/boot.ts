// Runs as a classic script in every lab page's head, before the body is parsed: it applies the
// page style, the stylesheet and theme at once, so the first paint already has them and nothing
// flashes unstyled.

import { bootLabSettings } from '../../../src/labs/index.js';
import { applyPageStyle } from './page-style.js';
import { labStorage } from './settings.js';

applyPageStyle();
bootLabSettings({ storage: labStorage() });
