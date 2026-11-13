'use client';

import type { RefObject } from 'react';
import { CheckGlyph, CloseGlyph } from '../../core/glyphs.js';
import type { ControlSize } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { formulaBarHooks as hooks } from './formula-bar-hooks.js';

/** The size of the bar's buttons, a step below the bar's own, as an icon button beside a field. */
export const actionSizes = { xs: 'xs', sm: 'xs', md: 'sm', lg: 'md' } as const;

/**
 * The buttons that restore and commit the content, enabled while the bar may do so; without them
 * (`hintId` given), the hidden text naming the keys that do it, which describes the content.
 */
export function FormulaBarButtons(props: {
  canCancel: boolean;
  canCommit: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  /** The content's editor, which takes focus back as a button disables itself by acting. */
  editorRef: RefObject<HTMLTextAreaElement | null>;
  hintId: string | null;
  size: ControlSize;
}) {
  const strings = useUiStrings();
  const act = (action: () => void) => () => {
    action();
    props.editorRef.current?.focus();
  };
  if (props.hintId) {
    return (
      <VisuallyHidden as="span" id={props.hintId}>
        {strings.formulaKeysHint}
      </VisuallyHidden>
    );
  }
  return (
    <>
      <Button
        icon={CloseGlyph}
        size={actionSizes[props.size]}
        label={strings.cancel}
        className={hooks.slotClass('cancel')}
        isDisabled={!props.canCancel}
        onPress={act(props.onCancel)}
      />
      <Button
        icon={CheckGlyph}
        size={actionSizes[props.size]}
        label={strings.confirm}
        className={hooks.slotClass('confirm')}
        isDisabled={!props.canCommit}
        onPress={act(props.onConfirm)}
      />
    </>
  );
}
