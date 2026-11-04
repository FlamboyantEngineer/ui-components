import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { DataAttributes } from '../core/hooks.js';
import { Button } from '../primitives/index.js';
import { mergeProps } from './merge-props.js';
import { renderElement } from './render-element.js';

const overflowing: DataAttributes = { 'data-overflowing': 'true' };
const variant: DataAttributes = { 'data-variant': 'primary' };

describe('renderElement', () => {
  it('UIC-COMPOSITION-1.2 renders the default element with its props', () => {
    const ref = createRef<HTMLElement>();
    render(
      renderElement(
        'nav',
        { className: 'ui-overflow-list', 'aria-label': 'Fruit', ref },
        { state: { isOverflowing: false } },
      ),
    );
    const nav = screen.getByRole('navigation', { name: 'Fruit' });
    expect(nav).toHaveClass('ui-overflow-list');
    expect(ref.current).toBe(nav);
  });

  it('UIC-COMPOSITION-1.2 UIC-HOOKS-1.4 hands the props, ref and state to the caller element', () => {
    const ref = createRef<HTMLDivElement>();
    let received: { isOverflowing: boolean } | null = null;
    render(
      renderElement(
        'div',
        { className: 'ui-overflow-list', ...overflowing, ref },
        {
          state: { isOverflowing: true },
          render: (props, state) => {
            received = state;
            return <div {...mergeProps(props, { className: 'caller', role: 'toolbar' })} />;
          },
        },
      ),
    );
    const toolbar = screen.getByRole('toolbar');
    expect(toolbar).toHaveClass('ui-overflow-list', 'caller');
    expect(toolbar).toHaveAttribute('data-overflowing', 'true');
    expect(ref.current).toBe(toolbar);
    expect(received).toEqual({ isOverflowing: true });
  });

  it('UIC-COMPOSITION-1.1 lets React Aria hand the hooks a wrapper passes to the render prop', async () => {
    const onPress = vi.fn();
    const pressed: boolean[] = [];
    render(
      <Button
        className="ui-button"
        {...variant}
        onPress={onPress}
        render={(props, state) => {
          pressed.push(state.isPressed);
          return <button {...props} />;
        }}
      >
        Save
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveClass('ui-button');
    expect(button).toHaveAttribute('data-variant', 'primary');
    expect(button).toHaveAttribute('data-rac');
    await userEvent.click(button);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(pressed).toContain(true);
  });
});
