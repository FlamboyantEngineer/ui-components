'use client';

import {
  useEditorEventCallback,
  useStopEvent,
  type NodeViewComponentProps,
} from '@handlewithcare/react-prosemirror';
import { useContext, useRef } from 'react';
import { mergeClassNames } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Checkbox } from '../checkbox/checkbox.js';
import { RichTextEditorContext, richTextEditorHooks as hooks } from './rich-text-context.js';

/** A task list item drawn by the editor: a checkbox that ticks the task, then its content. */
export function TaskItemView({
  children,
  nodeProps,
  ref,
  className,
  ...props
}: NodeViewComponentProps) {
  const strings = useUiStrings();
  const editor = useContext(RichTextEditorContext);
  const isEditable = editor?.isEditable ?? false;
  const isDisabled = editor?.isDisabled ?? false;
  const box = useRef<HTMLSpanElement>(null);
  const isChecked = nodeProps.node.attrs.checked === true;
  const setChecked = useEditorEventCallback((view, checked: boolean) => {
    view.dispatch(view.state.tr.setNodeAttribute(nodeProps.getPos(), 'checked', checked));
  });
  // The editor leaves events on the checkbox to it, so a press ticks the box instead of moving the caret.
  useStopEvent((_view, event) => box.current?.contains(event.target as Node | null) ?? false);
  const hookProps = hooks.slot('task-item', { checked: isChecked });
  return (
    <li
      {...props}
      {...hookProps}
      className={mergeClassNames(hookProps.className, className)}
      ref={ref}
    >
      <span {...hooks.slot('task-checkbox')} ref={box} contentEditable={false}>
        <Checkbox
          size="sm"
          aria-label={strings.taskDone}
          isSelected={isChecked}
          isDisabled={isDisabled}
          isReadOnly={!isEditable && !isDisabled}
          onChange={setChecked}
        />
      </span>
      <div {...hooks.slot('task-content')} ref={nodeProps.contentDOMRef}>
        {children}
      </div>
    </li>
  );
}
