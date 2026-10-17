import type { KeyboardEvent } from 'react';
import { Input } from 'react-aria-components';
import { useUiStrings } from '../../core/provider.js';
import type { UiStrings } from '../../core/strings.js';
import { Button } from '../button/button.js';
import { IconButton } from '../icon-button/icon-button.js';
import { codeEditorHooks as hooks } from './code-layers.js';
import type { CodeSearchModel } from './use-code-search.js';

export interface CodeSearchPanelProps {
  model: CodeSearchModel;
  /** A read-only or disabled editor finds but does not replace. */
  canReplace: boolean;
}

function describeStatus(model: CodeSearchModel, strings: UiStrings): string {
  if (model.matches.length > 0) return strings.stepOfTotal(model.current + 1, model.matches.length);
  return model.query ? strings.noResults : '';
}

/**
 * The find and replace row of a code editor: the find box and its match count, previous and next
 * match, and in an editable editor the replacement with Replace and Replace all. Enter finds the
 * next match (Shift+Enter the previous) or replaces, and Escape closes the row.
 */
export function CodeSearchPanel({ model, canReplace }: CodeSearchPanelProps) {
  const strings = useUiStrings();
  const hasMatches = model.matches.length > 0;
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') model.close();
    else if (event.key === 'Enter' && event.target === model.findRef.current) {
      model.step(event.shiftKey ? -1 : 1);
    } else if (event.key === 'Enter' && event.target instanceof HTMLInputElement) model.replace();
    else return;
    event.preventDefault();
    event.stopPropagation();
  };
  return (
    <div {...hooks.slot('search')} onKeyDown={onKeyDown}>
      <Input
        className={hooks.slotClass('search-input')}
        ref={model.findRef}
        aria-label={strings.find}
        value={model.query}
        onChange={(event) => model.setQuery(event.target.value)}
      />
      <span {...hooks.slot('search-status')} role="status">
        {describeStatus(model, strings)}
      </span>
      <IconButton
        icon="chevron-up"
        label={strings.previousMatch}
        size="sm"
        isDisabled={!hasMatches}
        onPress={() => model.step(-1)}
      />
      <IconButton
        icon="chevron-down"
        label={strings.nextMatch}
        size="sm"
        isDisabled={!hasMatches}
        onPress={() => model.step(1)}
      />
      {canReplace ? (
        <>
          <Input
            className={hooks.slotClass('replace-input')}
            aria-label={strings.replaceWith}
            value={model.replacement}
            onChange={(event) => model.setReplacement(event.target.value)}
          />
          <Button size="sm" variant="ghost" isDisabled={!hasMatches} onPress={model.replace}>
            {strings.replace}
          </Button>
          <Button size="sm" variant="ghost" isDisabled={!hasMatches} onPress={model.replaceAll}>
            {strings.replaceAll}
          </Button>
        </>
      ) : null}
      <IconButton icon="close" label={strings.close} size="sm" onPress={model.close} />
    </div>
  );
}
