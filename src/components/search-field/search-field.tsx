import { useRef, type RefObject } from 'react';
import {
  ButtonContext,
  Input,
  SearchField as AriaSearchField,
  type SearchFieldProps as AriaSearchFieldProps,
} from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Size } from '../../core/props.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { IconButton } from '../icon-button/icon-button.js';

export type SearchFieldSize = Extract<Size, 'sm' | 'md'>;

export interface SearchFieldProps
  extends
    Omit<AriaSearchFieldProps, 'className' | 'style' | 'children' | 'render' | 'aria-label'>,
    BaseProps {
  /** The accessible name of the search box. */
  label: string;
  /** A hint shown while the box is empty. */
  placeholder?: string | undefined;
  /** Names the clear button. Defaults to the provider's `clearSearch`. */
  clearLabel?: string | undefined;
  /** Visible text for the clear button, which otherwise shows the `close` glyph. */
  clearText?: string | undefined;
  /** Box size. Defaults to `md`. */
  size?: SearchFieldSize | undefined;
  /** Receives the input, so a caller can move focus to it. */
  inputRef?: RefObject<HTMLInputElement | null> | undefined;
}

const hooks = createHooks('search-field', ['glyph', 'input', 'clear']);

/**
 * The clear button. React Aria's own clear button is left out of the tab order and moves focus as a
 * press starts, which a keyboard press cannot survive, so this one stays outside its context.
 */
function ClearButton({ label, text, onPress }: { label: string; text?: string; onPress(): void }) {
  const shared = { className: hooks.slotClass('clear'), size: 'xs' as const, onPress };
  return (
    <ButtonContext.Provider value={null}>
      {text ? (
        <Button {...shared} variant="ghost" aria-label={label}>
          {text}
        </Button>
      ) : (
        <IconButton {...shared} icon="close" label={label} />
      )}
    </ButtonContext.Provider>
  );
}

/**
 * A search or filter box: a search glyph, the query input and a clear button while it holds text.
 * Escape clears the query and Enter submits it.
 */
export function SearchField({
  label,
  placeholder,
  clearLabel,
  clearText,
  size = 'md',
  inputRef,
  className,
  onClear,
  ...rest
}: SearchFieldProps) {
  const strings = useUiStrings();
  const ownInput = useRef<HTMLInputElement>(null);
  const input = inputRef ?? ownInput;
  return (
    <AriaSearchField
      {...rest}
      {...hooks.root({ className, props: rest, data: { size } })}
      aria-label={label}
      onClear={onClear}
    >
      {({ isEmpty, isDisabled, isReadOnly, state }) => (
        <>
          <Glyph name="search" className={hooks.slotClass('glyph')} />
          <Input {...hooks.slot('input')} ref={input} placeholder={placeholder} />
          {isEmpty || isDisabled || isReadOnly ? null : (
            <ClearButton
              label={clearLabel ?? strings.clearSearch}
              text={clearText}
              onPress={() => {
                input.current?.focus();
                state.setValue('');
                onClear?.();
              }}
            />
          )}
        </>
      )}
    </AriaSearchField>
  );
}
