import { useFocusHandback } from '../../utils/use-focus-handback.js';
import type { RichTextController } from './rich-text-controller.js';

/**
 * Sends focus back to the document after a command chosen in a menu, select or popover, once the
 * overlay gives focus back to its trigger: pass `ref` to the trigger or to an element around it.
 */
export function useFocusReturn(controller: RichTextController) {
  return useFocusHandback(controller.focus);
}
