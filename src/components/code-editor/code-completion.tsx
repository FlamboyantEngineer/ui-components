import type { RefObject } from 'react';
import { Popover, useLocale, type Placement } from 'react-aria-components';
import { useUiStrings } from '../../core/provider.js';
import { useLayerZIndex } from '../portal/portal.js';
import { codeEditorHooks as hooks } from './code-layers.js';
import type { CodeCompletionModel } from './use-code-completion.js';

export interface CodeCompletionListProps {
  model: CodeCompletionModel;
  id: string;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  caretRef: RefObject<HTMLSpanElement | null>;
}

/**
 * The completion list, a listbox in a non-modal popover at the caret, with the active option's
 * documentation beside it. React Aria repositions an open popover when its placement changes, so
 * each caret move alternates between the logical and physical spelling of the same placement.
 */
export function CodeCompletionList({ model, id, inputRef, caretRef }: CodeCompletionListProps) {
  const strings = useUiStrings();
  const { direction } = useLocale();
  const zIndex = useLayerZIndex('dropdown');
  const physical: Placement = direction === 'rtl' ? 'bottom right' : 'bottom left';
  const documentation = model.options[model.activeIndex]?.documentation;
  const documentationId = `${id}-documentation`;
  return (
    <Popover
      className={hooks.slotClass('popover')}
      isOpen={model.isOpen}
      onOpenChange={(open) => (open ? undefined : model.close())}
      isNonModal
      triggerRef={inputRef}
      getTargetRect={() => caretRef.current?.getBoundingClientRect()}
      placement={model.anchorKey % 2 === 0 ? 'bottom start' : physical}
      offset={2}
      style={{ zIndex }}
    >
      <div {...hooks.slot('completions')} id={id} role="listbox" aria-label={strings.suggestions}>
        {model.options.map((option, index) => (
          <div
            key={`${option.label}-${index}`}
            {...hooks.slot('completion', {
              focused: index === model.activeIndex,
              kind: option.kind,
            })}
            id={`${id}-${index}`}
            role="option"
            aria-selected={index === model.activeIndex}
            aria-describedby={
              index === model.activeIndex && documentation ? documentationId : undefined
            }
            onPointerDown={(event) => event.preventDefault()}
            onPointerMove={() => {
              if (index !== model.activeIndex) model.setActiveIndex(index);
            }}
            onClick={() => model.apply(option)}
          >
            <span {...hooks.slot('completion-label')}>{option.label}</span>
            {option.description ? (
              <span {...hooks.slot('completion-description')}>{option.description}</span>
            ) : null}
          </div>
        ))}
      </div>
      {documentation ? (
        <div
          {...hooks.slot('completion-documentation')}
          id={documentationId}
          onPointerDown={(event) => event.preventDefault()}
        >
          {documentation}
        </div>
      ) : null}
    </Popover>
  );
}
