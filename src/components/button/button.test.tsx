import { ChevronDownGlyph, PlusGlyph, SaveGlyph } from '../../core/glyphs.js';
import { act, render, screen } from '@testing-library/react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { userEvent } from '@testing-library/user-event';
import { Dialog, DialogTrigger, Popover } from '../../primitives/index.js';
import * as primitives from '../../primitives/index.js';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { mergeProps } from '../../utils/merge-props.js';
import { HoverCard, HoverCardTrigger } from '../hover-card/hover-card.js';
import { Tooltip } from '../tooltip/tooltip.js';
import { Button } from './button.js';

describe('Button', () => {
  it('UIC-HOOKS-2.3 keeps inactive hooks clear when caller attributes conflict', () => {
    const { rerender } = render(
      <Button data-full-width="true" fullWidth={false}>
        Save
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).not.toHaveAttribute('data-full-width');
    rerender(
      <Button data-full-width="false" fullWidth>
        Save
      </Button>,
    );
    expect(button).toHaveAttribute('data-full-width', 'true');
  });

  it('UIC-BUTTON-1.1 renders a native button of type button and reports presses', async () => {
    const user = userEvent.setup();

    const onPress = vi.fn();
    render(<Button onPress={onPress}>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button.tagName).toBe('BUTTON');
    expect(button).toHaveAttribute('type', 'button');
    await user.click(button);
    button.focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onPress).toHaveBeenCalledTimes(3);
  });

  it('UIC-BUTTON-1.1 submits forms with type submit and passes popup attributes through', async () => {
    const user = userEvent.setup();

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
    await user.click(button);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('UIC-BUTTON-1.1 triggers an overlay', async () => {
    const user = userEvent.setup();

    render(
      <DialogTrigger>
        <Button>Details</Button>
        <Popover>
          <Dialog aria-label="Details panel">Panel</Dialog>
        </Popover>
      </DialogTrigger>,
    );
    await user.click(screen.getByRole('button', { name: 'Details' }));
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
      <Button startIcon={PlusGlyph} endIcon={<svg role="img" aria-label="End glyph" />}>
        Add
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Add' });
    const start = button.querySelector('.ui-button__start-icon');
    expect(start).toHaveClass('ui-icon');
    expect(start).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('img', { name: 'End glyph', hidden: true }).parentElement).toHaveClass(
      'ui-button__end-icon',
    );
    expectHooksMatchSpec(document.body, 'BUTTON', { slots: ['label', 'start-icon', 'end-icon'] });
  });

  it('UIC-BUTTON-1.6 shows a tooltip on hover and keyboard focus without a wrapper', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const { container } = render(
        <Button tooltip="Save every change" isPending>
          Save
        </Button>,
      );
      const button = screen.getByRole('button', { name: /Save/ });
      expect(button.parentElement).toBe(container);
      await user.hover(button);
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

  it('UIC-BUTTON-1.6 leaves a hinted button to the caller tooltip or hover card around it', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const { rerender } = render(
        <Tooltip content="Saved to the shared folder">
          <Button tooltip="Save every change" shortcut="Mod+S">
            Save
          </Button>
        </Tooltip>,
      );
      const button = screen.getByRole('button', { name: /Save/ });
      await user.pointer({ target: document.body });
      await user.hover(button);
      await act(async () => {
        vi.advanceTimersByTime(500);
      });
      expect(screen.getByRole('tooltip')).toHaveTextContent('Saved to the shared folder');
      await user.unhover(button);
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      rerender(
        <HoverCardTrigger>
          <Button tooltip="Open the profile">Ana Lima</Button>
          <HoverCard aria-label="About Ana Lima">
            <p>Works on the north site.</p>
          </HoverCard>
        </HoverCardTrigger>,
      );
      const person = screen.getByRole('button', { name: 'Ana Lima' });
      expect(person).toHaveAttribute('aria-haspopup', 'dialog');
      await user.pointer([
        { target: document.body, coords: { clientX: 1, clientY: 1 } },
        { target: person },
      ]);
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByRole('dialog', { name: 'About Ana Lima' })).toBeInTheDocument();
      expect(person).toHaveAttribute('aria-expanded', 'true');
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

  it('UIC-BUTTON-1.6 opens its disabled hint on the first physical hover while refusing activation', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    const modality = vi
      .spyOn(primitives, 'getInteractionModality')
      .mockReturnValueOnce(null)
      .mockReturnValue('pointer');
    try {
      render(
        <Button isDisabled focusableWhenDisabled tooltip="Locked" onPress={onPress}>
          Edit
        </Button>,
      );
      const button = screen.getByRole('button', { name: 'Edit' });
      await user.hover(button);
      expect(await screen.findByRole('tooltip')).toHaveTextContent('Locked');
      expect(button).toHaveAttribute('aria-disabled', 'true');
      await user.click(button);
      await user.keyboard('{Enter} ');
      expect(onPress).not.toHaveBeenCalled();
    } finally {
      modality.mockRestore();
    }
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

  it('UIC-BUTTON-1.7 hydrates aria-keyshortcuts in the server notation, then the detected one', async () => {
    vi.resetModules();
    vi.stubGlobal('navigator', { platform: 'MacIntel' });
    const fresh = await import('./button.js');
    const print = (
      <fresh.Button shortcut={{ key: 'P', modifiers: ['primary'] }}>Print</fresh.Button>
    );
    // eslint-disable-next-line testing-library/render-result-naming-convention -- renderToString returns an HTML string, not a render result
    const markup = renderToString(print);
    expect(markup).toContain('aria-keyshortcuts="Control+P"');
    const host = document.body.appendChild(document.createElement('div'));
    host.innerHTML = markup;
    const errors = vi.spyOn(console, 'error');
    const hydrateErrors: unknown[] = [];
    let app: ReturnType<typeof hydrateRoot> | undefined;
    await act(async () => {
      app = hydrateRoot(host, print, {
        onRecoverableError: (error) => hydrateErrors.push(error),
      });
    });
    expect(hydrateErrors).toEqual([]);
    expect(errors).not.toHaveBeenCalled();
    expect(host.querySelector('button')).toHaveAttribute('aria-keyshortcuts', 'Meta+P');
    act(() => app?.unmount());
    host.remove();
    errors.mockRestore();
    vi.unstubAllGlobals();
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
    const user = userEvent.setup();

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
    await user.tab();
    expect(focusable).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    await user.click(focusable);
    expect(onPress).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
    expectHooksMatchSpec(document.body, 'BUTTON');
  });

  it('UIC-BUTTON-2.1 presses on the first try once enabled after a press while disabled', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    const { rerender } = render(
      <Button isDisabled onPress={onPress}>
        Save
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Save' });
    await user.click(button);
    expect(onPress).not.toHaveBeenCalled();
    rerender(<Button onPress={onPress}>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toBe(button);
    await user.click(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('UIC-BUTTON-2.2 keeps focus, icons and label while pending and refuses presses', async () => {
    const user = userEvent.setup();

    const onPress = vi.fn();
    render(
      <Button isPending startIcon={PlusGlyph} endIcon={ChevronDownGlyph} onPress={onPress}>
        Saving
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button).toBeEnabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAttribute('data-pending', 'true');
    expect(screen.getByRole('progressbar', { name: 'Loading' })).toHaveClass('ui-button__spinner');
    expect(button.querySelector('.ui-button__start-icon')).toBeInTheDocument();
    expect(button.querySelector('.ui-button__end-icon')).toBeInTheDocument();
    expect(button).toHaveTextContent('Saving');
    await user.click(button);
    expect(onPress).not.toHaveBeenCalled();
    expectHooksMatchSpec(document.body, 'BUTTON', {
      slots: ['spinner', 'start-icon', 'label', 'end-icon'],
    });
  });

  it('UIC-BUTTON-2.2 names a pending button that has aria-label by its label and busy indicator', () => {
    render(
      <Button isPending aria-label="More">
        …
      </Button>,
    );
    expect(screen.getByRole('button')).toHaveAccessibleName('More Loading');
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
    const user = userEvent.setup();
    render(<Button>States</Button>);
    const button = screen.getByRole('button');
    await user.hover(button);
    expect(button).toHaveAttribute('data-hovered', 'true');
    await user.pointer({ keys: '[MouseLeft>]', target: button });
    expect(button).toHaveAttribute('data-pressed', 'true');
    await user.pointer({ keys: '[/MouseLeft]', target: button });
    await user.unhover(button);
    button.blur();
    await user.tab();
    expect(button).toHaveAttribute('data-focus-visible', 'true');
    expect(button).toHaveAttribute('data-focused', 'true');
    expectHooksMatchSpec(document.body, 'BUTTON');
  });

  it('UIC-BUTTON-2.5 appends the caller class and forwards id, ref and data attributes', () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(
      <Button className="caller" id="save" ref={ref} data-owner="probe" data-variant="caller">
        Save
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveClass('ui-button', 'caller');
    expect(button).toHaveAttribute('id', 'save');
    expect(button).toHaveAttribute('data-variant', 'secondary');
    expect(button).toHaveAttribute('data-owner', 'probe');
    expect(ref.current).toBe(button);
    expectHooksMatchSpec(document.body, 'BUTTON', { callerAttributes: ['data-owner'] });
  });

  it('UIC-BUTTON-1.8 renders through the caller element with its hooks, states and ref', async () => {
    const user = userEvent.setup();

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
          return <button {...mergeProps(props, { 'data-caller': 'yes' })} />;
        }}
      >
        Bold
      </Button>,
    );
    const button = screen.getByRole('menuitemcheckbox', { name: 'Bold' });
    expect(button).toHaveAttribute('data-caller', 'yes');
    expect(button).toBe(ref.current);
    expect(button).toHaveClass('ui-button');
    expect(button).toHaveAttribute('data-variant', 'primary');
    expect(button).toHaveAttribute('role', 'menuitemcheckbox');
    expect(button).toHaveAttribute('aria-keyshortcuts', 'Control+B');
    await user.click(button);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(states).toContain(false);
    expectHooksMatchSpec(document.body, 'BUTTON', { callerAttributes: ['data-caller'] });
  });

  it('UIC-BUTTON-1.9 renders a link through the provider link renderer with its hooks', async () => {
    const user = userEvent.setup();

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
          startIcon={PlusGlyph}
          shortcut="Ctrl+N"
          onPress={onPress}
        >
          New report
        </Button>
        <Button href="https://example.com/help" target="_blank">
          Help
        </Button>
        <Button href="https://example.com/forum" target="_blank" rel="nofollow">
          Forum
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
    expect(screen.getByRole('link', { name: 'Help (opens in a new tab)' })).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    );
    expect(screen.getByRole('link', { name: 'Forum (opens in a new tab)' })).toHaveAttribute(
      'rel',
      'nofollow noopener noreferrer',
    );
    link.addEventListener('click', (event) => event.preventDefault());
    await user.click(link);
    expect(onPress).toHaveBeenCalledTimes(1);
    expectHooksMatchSpec(document.body, 'BUTTON', {
      slots: ['label', 'start-icon', 'end-icon', 'new-tab-label'],
      callerAttributes: ['data-router'],
    });
  });

  it('UIC-BUTTON-1.9 draws a disabled link as text that cannot be activated', async () => {
    const user = userEvent.setup();

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
    await user.click(link);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('UIC-BUTTON-1.9 names a link by aria-label or aria-labelledby and reports its key and focus handlers', async () => {
    const user = userEvent.setup();
    const onKeyDown = vi.fn();
    const onKeyUp = vi.fn();
    const onFocusChange = vi.fn();
    render(
      <>
        <span id="files-heading">Shared files</span>
        <Button
          href="/files"
          aria-label="Open files"
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          onFocusChange={onFocusChange}
        >
          Open
        </Button>
        <Button href="/shared" aria-labelledby="files-heading">
          12
        </Button>
        <Button href="/hidden" hidden>
          Hidden
        </Button>
      </>,
    );
    const files = screen.getByRole('link', { name: 'Open files' });
    expect(screen.getByRole('link', { name: 'Shared files' })).toHaveAttribute('href', '/shared');
    expect(screen.getByText('Hidden').closest('a')).toHaveAttribute('hidden');
    await user.tab();
    expect(files).toHaveFocus();
    await user.keyboard('a');
    expect(onKeyDown).toHaveBeenCalled();
    expect(onKeyUp).toHaveBeenCalled();
    expect(onFocusChange).toHaveBeenCalledWith(true);
  });

  it('UIC-BUTTON-1.9 marks a link that opens a new tab with the external-link glyph', () => {
    const { container } = render(
      <>
        <Button href="/reports">Reports</Button>
        <Button href="https://example.com/help" isExternal>
          Help
        </Button>
        <Button href="/guide" target="_blank">
          Guide
        </Button>
        <Button href="/print" target="_blank" endIcon={SaveGlyph}>
          Print
        </Button>
        <Button href="/notes" target="_blank" endIcon={null}>
          Notes
        </Button>
        <Button href="https://example.com/help" isExternal isDisabled>
          Archive
        </Button>
        <Button href="/share" isExternal icon={PlusGlyph} label="Share" />
      </>,
    );
    const glyph = (name: RegExp) =>
      screen.getByRole('link', { name }).querySelector('.ui-button__end-icon [data-glyph]');
    const reports = screen.getByRole('link', { name: 'Reports' });
    expect(reports.querySelector('.ui-button__end-icon')).toBeNull();
    const help = screen.getByRole('link', { name: 'Help (opens in a new tab)' });
    expect(help).toHaveAttribute('target', '_blank');
    expect(help).toHaveAttribute('rel', 'noopener noreferrer');
    expect(glyph(/^Help/)).toHaveAttribute('data-glyph', 'external-link');
    expect(glyph(/^Guide \(opens in a new tab\)$/)).toHaveAttribute('data-glyph', 'external-link');
    expect(glyph(/^Print \(opens in a new tab\)$/)).toHaveAttribute('data-glyph', 'save');
    expect(glyph(/^Notes \(opens in a new tab\)$/)).toBeNull();
    const archive = screen.getByRole('link', { name: 'Archive' });
    expect(archive.querySelector('.ui-button__end-icon')).toBeNull();
    const share = screen.getByRole('link', { name: 'Share (opens in a new tab)' });
    expect(share.querySelector('.ui-button__end-icon')).toBeNull();
    expect(container.querySelectorAll('.ui-button__new-tab-label')).toHaveLength(4);
  });

  it('UIC-BUTTON-1.9 publishes the underline of a link variant, none by default', () => {
    const { container } = render(
      <>
        <Button variant="link" href="#reports">
          Reports
        </Button>
        <Button variant="link" href="#guide" underline="hover">
          Guide
        </Button>
        <Button variant="link" underline="always">
          Show more
        </Button>
        <Button href="#help" underline="always">
          Help
        </Button>
      </>,
    );
    expect(screen.getByRole('link', { name: 'Reports' })).toHaveAttribute('data-underline', 'none');
    expect(screen.getByRole('link', { name: 'Guide' })).toHaveAttribute('data-underline', 'hover');
    expect(screen.getByRole('button', { name: 'Show more' })).toHaveAttribute(
      'data-underline',
      'always',
    );
    expect(screen.getByRole('link', { name: 'Help' })).not.toHaveAttribute('data-underline');
    expectHooksMatchSpec(container, 'BUTTON', { slots: ['label'] });
  });

  it('UIC-BUTTON-1.9 keeps target and rel off a disabled link', () => {
    render(
      <Button href="https://example.com/help" target="_blank" isDisabled>
        Help
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Help' });
    expect(link.tagName).toBe('SPAN');
    expect(link).not.toHaveAttribute('target');
    expect(link).not.toHaveAttribute('rel');
  });

  it('UIC-BUTTON-2.3 UIC-BUTTON-2.6 leaves aria-pressed off a toggle whose caller states toggle semantics', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <>
        <Button role="switch" aria-checked={false} onChange={onChange}>
          Wrap
        </Button>
        <Button role="menuitemcheckbox" aria-checked defaultSelected>
          Ruler
        </Button>
      </>,
    );
    const wrap = screen.getByRole('switch', { name: 'Wrap' });
    expect(wrap).not.toHaveAttribute('aria-pressed');
    const ruler = screen.getByRole('menuitemcheckbox', { name: 'Ruler' });
    expect(ruler).not.toHaveAttribute('aria-pressed');
    expect(ruler).toHaveAttribute('data-selected', 'true');
    await user.click(wrap);
    expect(onChange).toHaveBeenCalledWith(true);
    expect(wrap).not.toHaveAttribute('aria-pressed');
  });

  it('UIC-BUTTON-2.6 toggles its own state from defaultSelected and reports each change', async () => {
    const user = userEvent.setup();

    const onChange = vi.fn();
    render(
      <Button defaultSelected={false} onChange={onChange}>
        Bold
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Bold' });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(button).not.toHaveAttribute('data-selected');
    await user.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveAttribute('data-selected', 'true');
    expect(onChange).toHaveBeenLastCalledWith(true);
    button.focus();
    await user.keyboard(' ');
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(onChange).toHaveBeenLastCalledWith(false);
    expectHooksMatchSpec(document.body, 'BUTTON');
  });

  it('UIC-BUTTON-1.10 reports press, hover, focus and key handlers and takes focus options', async () => {
    const user = userEvent.setup();

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
    await user.keyboard('{Enter}');
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
    await user.hover(report);
    await user.unhover(report);
    expect(events).toEqual(expect.arrayContaining(['hover start', 'hover end']));
    const skipped = screen.getByRole('button', { name: 'Skipped' });
    expect(skipped).toHaveAttribute('tabindex', '-1');
    const input = screen.getByRole('textbox', { name: 'Query' });
    input.focus();
    await user.click(skipped);
    expect(input).toHaveFocus();
    expect(screen.getByText('Hidden').closest('button')).toHaveAttribute('hidden');
  });

  it('UIC-BUTTON-2.6 leaves a controlled toggle to its caller', async () => {
    const user = userEvent.setup();

    const onChange = vi.fn();
    const onPress = vi.fn();
    render(
      <Button isSelected onChange={onChange} onPress={onPress}>
        Italic
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Italic' });
    await user.click(button);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(false);
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });
  it('UIC-BUTTON-3.1 keeps synchronous commands synchronous and awaits icon commands', async () => {
    const user = userEvent.setup();
    const sync = vi.fn();
    let finish!: () => void;
    const promise = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const run = vi.fn(() => promise);
    render(
      <>
        <Button onPress={sync}>Apply</Button>
        <Button icon={SaveGlyph} label="Save changes" onPress={run} />
      </>,
    );
    const apply = screen.getByRole('button', { name: 'Apply' });
    await user.click(apply);
    await user.click(apply);
    expect(sync).toHaveBeenCalledTimes(2);
    expect(apply).not.toHaveAttribute('data-pending');
    const save = screen.getByRole('button', { name: 'Save changes' });
    await user.click(save);
    await user.click(save);
    expect(run).toHaveBeenCalledTimes(1);
    expect(save).toHaveAttribute('data-content', 'icon');
    expect(save).toHaveAttribute('data-pending', 'true');
    await act(async () => {
      finish();
      await promise;
    });
    expect(save).not.toHaveAttribute('data-pending');
  });

  describe('UIC-BUTTON-1.6 UIC-BUTTON-1.7 a hint that comes or goes', () => {
    const hintSteps = [
      { name: 'a tooltip', on: { tooltip: 'Save every change' } },
      { name: 'a shortcut', on: { shortcut: 'mod+s' } },
      {
        name: 'a disabled explanation',
        on: { tooltip: 'Nothing to save', isDisabled: true, focusableWhenDisabled: true },
      },
      { name: 'a pending hint', on: { tooltip: 'Saving', isPending: true } },
    ] as const;

    it.each(hintSteps)(
      'keeps the focused button and its content when $name comes and goes',
      ({ on }) => {
        const ref = { current: null as HTMLButtonElement | null };
        const focusable = 'focusableWhenDisabled' in on ? { focusableWhenDisabled: true } : {};
        const { rerender } = render(
          <Button ref={ref} {...focusable}>
            <span data-probe>Save</span>
          </Button>,
        );
        const button = screen.getByRole('button');
        const label = button.querySelector('[data-probe]');
        act(() => button.focus());
        rerender(
          <Button ref={ref} {...on}>
            <span data-probe>Save</span>
          </Button>,
        );
        expect(screen.getByRole('button')).toBe(button);
        expect(button.querySelector('[data-probe]')).toBe(label);
        expect(button).toHaveFocus();
        expect(ref.current).toBe(button);
        rerender(
          <Button ref={ref} {...focusable}>
            <span data-probe>Save</span>
          </Button>,
        );
        expect(screen.getByRole('button')).toBe(button);
        expect(button.querySelector('[data-probe]')).toBe(label);
        expect(button).toHaveFocus();
      },
    );

    it('keeps a focused link and an open hint in step as the hint changes, comes and goes', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<Button href="/a">Open</Button>);
      const link = screen.getByRole('link', { name: 'Open' });
      await user.tab();
      expect(link).toHaveFocus();
      rerender(
        <Button href="/a" tooltip="Open the record">
          Open
        </Button>,
      );
      expect(screen.getByRole('link')).toBe(link);
      expect(link).toHaveFocus();
      await user.tab({ shift: true });
      await user.tab();
      expect(await screen.findByRole('tooltip')).toHaveTextContent('Open the record');
      rerender(
        <Button href="/a" tooltip="Open the first record">
          Open
        </Button>,
      );
      expect(link).toHaveFocus();
      expect(screen.getByRole('tooltip')).toHaveTextContent('Open the first record');
      expect(link).toHaveAccessibleDescription('Open the first record');
      rerender(<Button href="/a">Open</Button>);
      expect(screen.getByRole('link')).toBe(link);
      expect(link).toHaveFocus();
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });
});
