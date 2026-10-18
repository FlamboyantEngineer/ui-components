import { act, fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Dialog, DialogTrigger, Popover } from '../../primitives/index.js';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { mergeProps } from '../../utils/merge-props.js';
import { Button } from './button.js';

describe('Button', () => {
  it('UIC-BUTTON-1.1 renders a native button of type button and reports presses', async () => {
    const onPress = vi.fn();
    render(<Button onPress={onPress}>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button.tagName).toBe('BUTTON');
    expect(button).toHaveAttribute('type', 'button');
    await userEvent.click(button);
    button.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(onPress).toHaveBeenCalledTimes(3);
  });

  it('UIC-BUTTON-1.1 submits forms with type submit and passes popup attributes through', async () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit" aria-haspopup="menu" aria-expanded={false} aria-controls="menu-1">
          Send
        </Button>
      </form>,
    );
    const button = screen.getByRole('button', { name: 'Send' });
    expect(button).toHaveAttribute('aria-haspopup', 'menu');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAttribute('aria-controls', 'menu-1');
    await userEvent.click(button);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('UIC-BUTTON-1.1 triggers an overlay', async () => {
    render(
      <DialogTrigger>
        <Button>Details</Button>
        <Popover>
          <Dialog aria-label="Details panel">Panel</Dialog>
        </Popover>
      </DialogTrigger>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Details' }));
    expect(await screen.findByRole('dialog', { name: 'Details panel' })).toBeInTheDocument();
  });

  it('UIC-BUTTON-1.2 UIC-BUTTON-1.3 publishes variant and size with defaults', () => {
    const { rerender } = render(<Button>Go</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-variant', 'secondary');
    expect(button).toHaveAttribute('data-size', 'md');
    for (const variant of [
      'primary',
      'secondary',
      'tertiary',
      'danger',
      'ghost',
      'accent',
      'chip',
      'link',
      'bare',
    ] as const) {
      for (const size of ['xs', 'sm', 'md', 'lg'] as const) {
        rerender(
          <Button variant={variant} size={size}>
            Go
          </Button>,
        );
        expect(button).toHaveAttribute('data-variant', variant);
        expect(button).toHaveAttribute('data-size', size);
        expectHooksMatchSpec(document.body, 'BUTTON', { slots: ['label'] });
      }
    }
  });

  it('UIC-BUTTON-1.4 lays out content as a label, parts or a sentence', () => {
    const { rerender } = render(<Button>Label</Button>);
    const button = screen.getByRole('button');
    expect(button.querySelector('.ui-button__label')).toHaveTextContent('Label');
    expect(button).toHaveAttribute('data-content', 'label');
    expect(button).toHaveAttribute('data-align', 'center');

    rerender(
      <Button content="parts" align="start" fullWidth>
        <span>One</span>
        <span>Two</span>
      </Button>,
    );
    expect(button.querySelector('.ui-button__label')).toBeNull();
    expect(button.children).toHaveLength(2);
    expect(button).toHaveAttribute('data-content', 'parts');
    expect(button).toHaveAttribute('data-align', 'start');
    expect(button).toHaveAttribute('data-full-width', 'true');

    rerender(<Button content="sentence">A starter prompt that wraps</Button>);
    expect(button).toHaveAttribute('data-content', 'sentence');
    expectHooksMatchSpec(document.body, 'BUTTON');
  });

  it('UIC-BUTTON-1.5 draws decorative start and end icons', () => {
    render(
      <Button startIcon="plus" endIcon={<svg data-testid="custom-end" />}>
        Add
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Add' });
    const start = button.querySelector('.ui-button__start-icon');
    expect(start).toHaveClass('ui-icon');
    expect(start).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByTestId('custom-end').parentElement).toHaveClass('ui-button__end-icon');
    expectHooksMatchSpec(document.body, 'BUTTON', { slots: ['label', 'start-icon', 'end-icon'] });
  });

  it('UIC-BUTTON-1.6 shows a tooltip on hover and keyboard focus without a wrapper', async () => {
    vi.useFakeTimers();
    try {
      const { container } = render(
        <Button tooltip="Save every change" isPending>
          Save
        </Button>,
      );
      const button = screen.getByRole('button', { name: /Save/ });
      expect(button.parentElement).toBe(container);
      fireEvent.pointerMove(button, { pointerType: 'mouse' });
      fireEvent.pointerEnter(button, { pointerType: 'mouse' });
      fireEvent.mouseEnter(button);
      await act(async () => {
        vi.advanceTimersByTime(500);
      });
      expect(screen.getByRole('tooltip')).toHaveTextContent('Save every change');
      expect(button).toHaveAttribute('aria-describedby', screen.getByRole('tooltip').id);
      expectHooksMatchSpec(document.body, 'TOOLTIP', { slots: ['content'] });
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('UIC-BUTTON-1.6 explains a focusable disabled button but not a natively disabled one', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <Button isDisabled tooltip="Locked">
        Edit
      </Button>,
    );
    await user.tab();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    rerender(
      <Button isDisabled focusableWhenDisabled tooltip="Locked">
        Edit
      </Button>,
    );
    await user.tab();
    expect(screen.getByRole('button', { name: 'Edit' })).toHaveFocus();
    expect(screen.getByRole('tooltip')).toHaveTextContent('Locked');
  });

  it('UIC-BUTTON-1.7 shows its shortcut after the hint and publishes aria-keyshortcuts', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    const { rerender } = render(
      <>
        <Button tooltip="Save every change" shortcut="Ctrl+Shift+S" onPress={onPress}>
          Save
        </Button>
        <Button shortcut={{ key: 'P', modifiers: ['primary'] }}>Print</Button>
      </>,
    );
    const save = screen.getByRole('button', { name: 'Save' });
    expect(save).toHaveAttribute('aria-keyshortcuts', 'Control+Shift+S');
    await user.tab();
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip.querySelector('.ui-tooltip__content')?.firstChild?.textContent).toBe(
      'Save every change',
    );
    const keys = tooltip.querySelector('.ui-shortcut');
    expect(keys?.querySelector('.ui-shortcut__keys')).toHaveTextContent('Ctrl+Shift+S');
    expect(save).toHaveAccessibleDescription('Save every change Control Shift S');
    expectHooksMatchSpec(document.body, 'SHORTCUT', { slots: ['keys', 'key', 'text'] });
    await user.keyboard('{Control>}{Shift>}s{/Shift}{/Control}');
    expect(onPress).not.toHaveBeenCalled();

    await user.tab();
    const print = screen.getByRole('button', { name: 'Print' });
    expect(print).toHaveAttribute('aria-keyshortcuts', 'Control+P');
    expect(screen.getByRole('tooltip')).toHaveTextContent(/^Ctrl\+PControl P$/);
    expect(print).toHaveAccessibleDescription('Control P');

    rerender(
      <Button tooltip="Save every change" shortcut="Ctrl+">
        Save
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Save' })).not.toHaveAttribute('aria-keyshortcuts');
  });

  it('UIC-BUTTON-1.7 keeps a role and its states beside the shortcut', () => {
    render(
      <Button role="menuitemcheckbox" aria-checked shortcut="Ctrl+B">
        Bold
      </Button>,
    );
    const bold = screen.getByRole('menuitemcheckbox', { name: 'Bold' });
    expect(bold).toBeChecked();
    expect(bold).toHaveAttribute('aria-keyshortcuts', 'Control+B');
  });

  it('UIC-BUTTON-2.1 disables natively, or keeps focus while refusing activation', async () => {
    const onPress = vi.fn();
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    const { rerender } = render(
      <Button isDisabled onPress={onPress}>
        Off
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('data-disabled', 'true');

    rerender(
      <form onSubmit={onSubmit}>
        <Button isDisabled focusableWhenDisabled type="submit" onPress={onPress}>
          Off
        </Button>
      </form>,
    );
    const focusable = screen.getByRole('button');
    expect(focusable).toBeEnabled();
    expect(focusable).toHaveAttribute('aria-disabled', 'true');
    expect(focusable).toHaveAttribute('data-disabled', 'true');
    await userEvent.tab();
    expect(focusable).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    await userEvent.click(focusable);
    expect(onPress).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
    expectHooksMatchSpec(document.body, 'BUTTON');
  });

  it('UIC-BUTTON-2.2 keeps focus and label while pending and refuses presses', async () => {
    const onPress = vi.fn();
    render(
      <Button isPending startIcon="plus" endIcon="chevron-down" onPress={onPress}>
        Saving
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button).toBeEnabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAttribute('data-pending', 'true');
    expect(screen.getByRole('progressbar', { name: 'Loading' })).toHaveClass('ui-button__spinner');
    expect(button.querySelector('.ui-button__start-icon, .ui-button__end-icon')).toBeNull();
    expect(button).toHaveTextContent('Saving');
    await userEvent.click(button);
    expect(onPress).not.toHaveBeenCalled();
    expectHooksMatchSpec(document.body, 'BUTTON', { slots: ['spinner', 'label'] });
  });

  it('UIC-BUTTON-2.3 marks the current choice and respects caller toggle semantics', () => {
    const { rerender } = render(<Button isSelected>Bold</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-selected', 'true');
    expect(button).toHaveAttribute('aria-pressed', 'true');

    rerender(
      <Button isSelected aria-pressed="mixed">
        Bold
      </Button>,
    );
    expect(button).toHaveAttribute('aria-pressed', 'mixed');

    rerender(
      <Button isSelected role="option" aria-selected>
        Choice
      </Button>,
    );
    expect(screen.getByRole('option')).not.toHaveAttribute('aria-pressed');
  });

  it('UIC-BUTTON-2.4 publishes hover, press and keyboard focus states', async () => {
    render(<Button>States</Button>);
    const button = screen.getByRole('button');
    await userEvent.hover(button);
    expect(button).toHaveAttribute('data-hovered', 'true');
    fireEvent.pointerDown(button, { pointerType: 'mouse', button: 0 });
    expect(button).toHaveAttribute('data-pressed', 'true');
    fireEvent.pointerUp(button, { pointerType: 'mouse', button: 0 });
    await userEvent.unhover(button);
    button.blur();
    await userEvent.tab();
    expect(button).toHaveAttribute('data-focus-visible', 'true');
    expect(button).toHaveAttribute('data-focused', 'true');
    expectHooksMatchSpec(document.body, 'BUTTON');
  });

  it('UIC-BUTTON-2.5 appends the caller class and forwards id, ref and data attributes', () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(
      <Button className="caller" id="save" ref={ref} data-testid="probe" data-variant="caller">
        Save
      </Button>,
    );
    const button = screen.getByTestId('probe');
    expect(button).toHaveClass('ui-button', 'caller');
    expect(button).toHaveAttribute('id', 'save');
    expect(button).toHaveAttribute('data-variant', 'secondary');
    expect(ref.current).toBe(button);
    expectHooksMatchSpec(document.body, 'BUTTON');
  });

  it('UIC-BUTTON-1.8 renders through the caller element with its hooks, states and ref', async () => {
    const onPress = vi.fn();
    const ref = { current: null as HTMLButtonElement | HTMLAnchorElement | null };
    const states: boolean[] = [];
    render(
      <Button
        ref={ref}
        variant="primary"
        role="menuitemcheckbox"
        aria-checked
        shortcut="Ctrl+B"
        onPress={onPress}
        render={(props, state) => {
          states.push(state.isHovered, state.isPressed, state.isFocusVisible, state.isPending);
          return <button {...mergeProps(props, { 'data-testid': 'caller' })} />;
        }}
      >
        Bold
      </Button>,
    );
    const button = screen.getByTestId('caller');
    expect(button).toBe(ref.current);
    expect(button).toHaveClass('ui-button');
    expect(button).toHaveAttribute('data-variant', 'primary');
    expect(button).toHaveAttribute('role', 'menuitemcheckbox');
    expect(button).toHaveAttribute('aria-keyshortcuts', 'Control+B');
    await userEvent.click(button);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(states).toContain(false);
    expectHooksMatchSpec(document.body, 'BUTTON', { callerAttributes: ['data-testid'] });
  });

  it('UIC-BUTTON-1.9 renders a link through the provider link renderer with its hooks', async () => {
    const onPress = vi.fn();
    const renderLink = vi.fn((props: React.ComponentProps<'a'>) => (
      <a {...props} data-router="yes" />
    ));
    const ref = { current: null as HTMLButtonElement | HTMLAnchorElement | null };
    render(
      <UiProvider renderLink={renderLink}>
        <Button
          ref={ref}
          href="/reports/new"
          variant="primary"
          startIcon="plus"
          shortcut="Ctrl+N"
          onPress={onPress}
        >
          New report
        </Button>
        <Button href="https://example.com/help" target="_blank">
          Help
        </Button>
      </UiProvider>,
    );
    const link = screen.getByRole('link', { name: 'New report' });
    expect(link.tagName).toBe('A');
    expect(link).toBe(ref.current);
    expect(link).toHaveAttribute('href', '/reports/new');
    expect(link).toHaveAttribute('data-router', 'yes');
    expect(link).toHaveClass('ui-button');
    expect(link).toHaveAttribute('data-variant', 'primary');
    expect(link).toHaveAttribute('aria-keyshortcuts', 'Control+N');
    expect(link).not.toHaveAttribute('type');
    expect(link.querySelector('.ui-button__start-icon')).not.toBeNull();
    expect(screen.getByRole('link', { name: 'Help' })).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    );
    link.addEventListener('click', (event) => event.preventDefault());
    await userEvent.click(link);
    expect(onPress).toHaveBeenCalledTimes(1);
    expectHooksMatchSpec(document.body, 'BUTTON', {
      slots: ['label', 'start-icon'],
      callerAttributes: ['data-router'],
    });
  });

  it('UIC-BUTTON-1.9 draws a disabled link as text that cannot be activated', async () => {
    const onPress = vi.fn();
    render(
      <Button href="/reports" isDisabled onPress={onPress}>
        Reports
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Reports' });
    expect(link.tagName).toBe('SPAN');
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('data-disabled', 'true');
    await userEvent.click(link);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('UIC-BUTTON-2.6 toggles its own state from defaultSelected and reports each change', async () => {
    const onChange = vi.fn();
    render(
      <Button defaultSelected={false} onChange={onChange}>
        Bold
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Bold' });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(button).not.toHaveAttribute('data-selected');
    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveAttribute('data-selected', 'true');
    expect(onChange).toHaveBeenLastCalledWith(true);
    button.focus();
    await userEvent.keyboard(' ');
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(onChange).toHaveBeenLastCalledWith(false);
    expectHooksMatchSpec(document.body, 'BUTTON');
  });

  it('UIC-BUTTON-1.10 reports press, hover, focus and key handlers and takes focus options', async () => {
    const events: string[] = [];
    const log = (name: string) => () => events.push(name);
    render(
      <>
        <input aria-label="Query" />
        <Button
          autoFocus
          onPressStart={log('press start')}
          onPressEnd={log('press end')}
          onPressUp={log('press up')}
          onPressChange={(pressed) => events.push(`pressed ${pressed}`)}
          onHoverStart={log('hover start')}
          onHoverEnd={log('hover end')}
          onFocusChange={(focused) => events.push(`focused ${focused}`)}
          onKeyDown={log('key down')}
        >
          Report
        </Button>
        <Button excludeFromTabOrder preventFocusOnPress>
          Skipped
        </Button>
        <Button hidden>Hidden</Button>
      </>,
    );
    const report = screen.getByRole('button', { name: 'Report' });
    expect(report).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(events).toEqual(
      expect.arrayContaining([
        'focused true',
        'key down',
        'press start',
        'pressed true',
        'press up',
        'press end',
      ]),
    );
    await userEvent.hover(report);
    await userEvent.unhover(report);
    expect(events).toEqual(expect.arrayContaining(['hover start', 'hover end']));
    const skipped = screen.getByRole('button', { name: 'Skipped' });
    expect(skipped).toHaveAttribute('tabindex', '-1');
    const input = screen.getByRole('textbox', { name: 'Query' });
    input.focus();
    await userEvent.click(skipped);
    expect(input).toHaveFocus();
    expect(screen.getByText('Hidden').closest('button')).toHaveAttribute('hidden');
  });

  it('UIC-BUTTON-2.6 leaves a controlled toggle to its caller', async () => {
    const onChange = vi.fn();
    const onPress = vi.fn();
    render(
      <Button isSelected onChange={onChange} onPress={onPress}>
        Italic
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Italic' });
    await userEvent.click(button);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(false);
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });
});
