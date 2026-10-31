import {
  CloseGlyph,
  CopyGlyph,
  DeleteGlyph,
  EditGlyph,
  EyeGlyph,
  HelpGlyph,
  MoreGlyph,
  RedoGlyph,
  UndoGlyph,
} from '../../core/glyphs.js';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Button } from './button.js';

describe('Button', () => {
  it('UIC-BUTTON-11.1 names the button with its label and draws a decorative icon', async () => {
    const user = userEvent.setup();

    const onPress = vi.fn();
    render(<Button icon={CloseGlyph} label="Close" onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'Close' });
    const icon = button.querySelector('.ui-button__icon');
    expect(icon).toHaveClass('ui-icon');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(button).not.toHaveTextContent(/\S/);
    await user.click(button);
    expect(onPress).toHaveBeenCalledTimes(1);
    expectHooksMatchSpec(document.body, 'BUTTON', { slots: ['icon'] });
  });

  it('UIC-BUTTON-11.1 accepts icon nodes and rejects an empty label', () => {
    render(<Button icon={<svg aria-label="Custom glyph" />} label="Custom" />);
    expect(screen.getByLabelText('Custom glyph').parentElement).toHaveClass('ui-button__icon');
    expect(() => render(<Button icon={CloseGlyph} label="  " />)).toThrow(/label/);
  });

  it.each([
    ['false', false],
    ['null', null],
    ['undefined', undefined],
  ] as const)(
    'UIC-BUTTON-11.1 treats an icon of %s as no icon, in button and link modes',
    (_, empty) => {
      const showsIcon = false as boolean;
      const { rerender } = render(
        <>
          <Button icon={empty}>Save</Button>
          <Button icon={showsIcon && CopyGlyph} label="Copy" href="/copy">
            Copy link
          </Button>
        </>,
      );
      const save = screen.getByRole('button', { name: 'Save' });
      const link = screen.getByRole('link', { name: 'Copy link' });
      for (const element of [save, link]) {
        expect(element).toHaveAttribute('data-content', 'label');
        expect(element).toHaveAttribute('data-variant', 'secondary');
        expect(element.querySelector('.ui-button__icon')).toBeNull();
        expect(element).not.toHaveAttribute('aria-label');
      }
      rerender(
        <>
          <Button icon={CopyGlyph} label="Save">
            Save
          </Button>
          <Button icon={CopyGlyph} label="Copy" href="/copy">
            Copy link
          </Button>
        </>,
      );
      expect(save).toHaveAttribute('data-content', 'icon');
      expect(save).toHaveAttribute('data-variant', 'ghost');
      expect(screen.getByRole('link', { name: 'Copy' })).toHaveAttribute('data-content', 'icon');
      rerender(<Button icon={empty}>Save</Button>);
      expect(save).toHaveAttribute('data-content', 'label');
      expect(save.querySelector('.ui-button__icon')).toBeNull();
    },
  );

  it('UIC-BUTTON-11.2 publishes variant and size, ghost and medium by default', () => {
    const { rerender } = render(<Button icon={MoreGlyph} label="More" />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-variant', 'ghost');
    expect(button).toHaveAttribute('data-size', 'md');
    for (const size of ['xs', 'sm', 'md', 'lg'] as const) {
      rerender(<Button icon={MoreGlyph} label="More" variant="secondary" size={size} />);
      expect(button).toHaveAttribute('data-size', size);
      expect(button).toHaveAttribute('data-variant', 'secondary');
    }
  });

  it('UIC-BUTTON-11.3 offers disabled, focusable disabled, pending and selected states', async () => {
    const user = userEvent.setup();

    const onPress = vi.fn();
    const { rerender } = render(
      <Button icon={UndoGlyph} label="Undo" isDisabled onPress={onPress} />,
    );
    expect(screen.getByRole('button')).toBeDisabled();

    rerender(
      <Button icon={UndoGlyph} label="Undo" isDisabled focusableWhenDisabled onPress={onPress} />,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAttribute('data-disabled', 'true');
    await user.click(button);
    expect(onPress).not.toHaveBeenCalled();

    rerender(<Button icon={UndoGlyph} label="Undo" isPending onPress={onPress} />);
    expect(button.querySelector('.ui-button__spinner')).not.toBeNull();
    expect(button.querySelector('.ui-button__icon')).toBeInTheDocument();
    expect(button).toHaveAttribute('data-pending', 'true');
    expect(button).toHaveAccessibleName('Undo Loading');
    expectHooksMatchSpec(document.body, 'BUTTON', { slots: ['spinner'] });

    rerender(<Button icon={UndoGlyph} label="Undo" isSelected />);
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveAttribute('data-selected', 'true');
  });

  it('UIC-BUTTON-11.4 appends the caller class and forwards id, ref and data attributes', () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(
      <Button
        icon={HelpGlyph}
        label="Help"
        className="caller"
        id="help"
        ref={ref}
        data-probe="help"
      />,
    );
    const button = screen.getByRole('button', { name: 'Help' });
    expect(button).toHaveClass('ui-button', 'caller');
    expect(button).toHaveAttribute('id', 'help');
    expect(button).toHaveAttribute('data-probe', 'help');
    expect(ref.current).toBe(button);
    expectHooksMatchSpec(document.body, 'BUTTON', { callerAttributes: ['data-probe'] });
  });

  it('UIC-BUTTON-11.5 shows a tooltip that describes the button and keeps its label', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Button icon={UndoGlyph} label="Undo" tooltip="Undo the last edit" />,
    );
    const button = screen.getByRole('button', { name: 'Undo' });
    expect(button.parentElement).toBe(container);
    await user.tab();
    const panel = screen.getByRole('tooltip');
    expect(panel).toHaveTextContent('Undo the last edit');
    expect(button).toHaveAccessibleName('Undo');
    expect(button).toHaveAccessibleDescription('Undo the last edit');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  });

  it('UIC-BUTTON-11.6 shows its label and shortcut in the tooltip and publishes aria-keyshortcuts', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Button icon={UndoGlyph} label="Undo" shortcut="Ctrl+Z" />
        <Button
          icon={RedoGlyph}
          label="Redo"
          tooltip="Redo the last edit"
          shortcut="Ctrl+Shift+Z"
        />
      </>,
    );
    const undo = screen.getByRole('button', { name: 'Undo' });
    expect(undo).toHaveAttribute('aria-keyshortcuts', 'Control+Z');
    await user.tab();
    expect(screen.getByRole('tooltip')).toHaveTextContent(/^Undo Ctrl\+ZControl Z$/);
    expect(undo).toHaveAccessibleName('Undo');
    expect(undo).toHaveAccessibleDescription('Undo Control Z');
    await user.tab();
    const redo = screen.getByRole('button', { name: 'Redo' });
    expect(redo).toHaveAttribute('aria-keyshortcuts', 'Control+Shift+Z');
    expect(redo).toHaveAccessibleDescription('Redo the last edit Control Shift Z');
    expectHooksMatchSpec(document.body, 'BUTTON');
  });

  it('UIC-BUTTON-11.7 lets a tooltip that repeats the label name the button without describing it', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Button icon={EditGlyph} label="Rename" tooltip="Rename" />
        <Button icon={DeleteGlyph} label="Delete" tooltip="Delete the selected rows" />
      </>,
    );
    await user.tab();
    const rename = screen.getByRole('button', { name: 'Rename' });
    expect(rename).toHaveFocus();
    expect(screen.getByRole('tooltip')).toHaveTextContent('Rename');
    expect(rename).not.toHaveAttribute('aria-describedby');
    expect(rename).not.toHaveAccessibleDescription();
    await user.tab();
    const remove = screen.getByRole('button', { name: 'Delete' });
    expect(screen.getByRole('tooltip')).toHaveTextContent('Delete the selected rows');
    expect(remove).toHaveAccessibleDescription('Delete the selected rows');
  });

  it('UIC-BUTTON-11.8 toggles, renders as a link and swaps its element as Button does', async () => {
    const user = userEvent.setup();

    const onChange = vi.fn();
    render(
      <>
        <Button icon={EyeGlyph} label="Show hidden" defaultSelected={false} onChange={onChange} />
        <Button icon={HelpGlyph} label="Help" href="/help" />
        <Button
          icon={CopyGlyph}
          label="Copy"
          render={(props) => <button {...props} data-swapped="true" />}
        />
      </>,
    );
    const toggle = screen.getByRole('button', { name: 'Show hidden' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(toggle).toHaveAttribute('data-selected', 'true');
    expect(onChange).toHaveBeenCalledWith(true);
    const link = screen.getByRole('link', { name: 'Help' });
    expect(link).toHaveAttribute('href', '/help');
    expect(link).toHaveClass('ui-button');
    expect(link.querySelector('.ui-button__icon')).not.toBeNull();
    const swapped = screen.getByRole('button', { name: 'Copy' });
    expect(swapped).toHaveAttribute('data-swapped', 'true');
    expect(swapped).toHaveClass('ui-button');
    expectHooksMatchSpec(document.body, 'BUTTON', {
      slots: ['icon'],
      callerAttributes: ['data-swapped'],
    });
  });
});
