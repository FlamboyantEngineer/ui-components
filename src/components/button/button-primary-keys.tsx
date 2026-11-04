'use client';

import { useContext } from 'react';
import { passPrimaryActionKey, PrimaryActionKeysContext } from '../../utils/primary-action-keys.js';
import type { ButtonStateProps } from './button-state.js';

/** Leaves a dialog's modified Enter to its shortcut, keeping the caller's handler and render. */
export function usePrimaryActionKeys<P extends ButtonStateProps>(given: P): P {
  const isBoundary = useContext(PrimaryActionKeysContext);
  const { render, onKeyDown } = given;
  if (!isBoundary) return given;
  const renderButton: NonNullable<ButtonStateProps['render']> = (props, state) => {
    const forwarded = {
      ...props,
      onKeyDown: (event: Parameters<NonNullable<typeof props.onKeyDown>>[0]) => {
        if (passPrimaryActionKey(event)) {
          if (props.onKeyDown) onKeyDown?.(event);
        } else props.onKeyDown?.(event);
      },
    };
    return render ? render(forwarded, state) : <button {...forwarded} />;
  };
  return { ...given, render: renderButton };
}
