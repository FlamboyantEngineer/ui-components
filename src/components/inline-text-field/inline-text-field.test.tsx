import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useEffect, useRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { InlineTextField, type InlineTextFieldProps } from './inline-text-field.js';

/** A host that listens for keys and clipboard events natively, as a rich-text editor does. */
function EditorHost({
  onHostEvent,
  ...field
}: InlineTextFieldProps & { onHostEvent: (type: string) => void }) {
  const hostRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const types = ['keydown', 'keyup', 'paste', 'copy', 'cut'];
    const listener = (event: Event) => {
      onHostEvent(event instanceof KeyboardEvent ? `${event.type}:${event.key}` : event.type);
    };
    for (const type of types) host.addEventListener(type, listener);
    return () => {
      for (const type of types) host.removeEventListener(type, listener);
    };
  }, [onHostEvent]);
  return (
    <div ref={hostRef} contentEditable suppressContentEditableWarning>
      <p>Before the figure</p>
      <figure contentEditable={false}>
        <InlineTextField {...field} />
      </figure>
    </div>
  );
}

/** A host that returns focus to its document from the field's callbacks, as an editor does. */
function FocusReturningHost(field: Pick<InlineTextFieldProps, 'onCommit' | 'onCancel'>) {
  return (
    <>
      <InlineTextField value="A pear" aria-label="Caption" {...field} />
      <button type="button">Document</button>
    </>
  );
}

describe('InlineTextField', () => {
  it('UIC-INLINE-TEXT-FIELD-1.1 renders a text input that takes no focus on mount', () => {
    const { container } = render(
      <InlineTextField
        value="A pear"
        aria-label="Caption"
        placeholder="Add a caption"
        className="caption"
        data-role="caption"
        id="caption"
      />,
    );
    const input = screen.getByRole('textbox', { name: 'Caption' });
    expect(input).toHaveValue('A pear');
    expect(input).toHaveAttribute('placeholder', 'Add a caption');
    expect(input).toHaveClass('ui-inline-text-field', 'caption');
    expect(input).toHaveAttribute('id', 'caption');
    expect(input).not.toHaveFocus();
    expectHooksMatchSpec(container, 'INLINE-TEXT-FIELD', { callerAttributes: ['data-role'] });
  });

  it('UIC-INLINE-TEXT-FIELD-1.1 focuses on mount only with autoFocus', () => {
    render(<InlineTextField value="" aria-label="Caption" autoFocus />);
    expect(screen.getByRole('textbox', { name: 'Caption' })).toHaveFocus();
  });

  it('UIC-INLINE-TEXT-FIELD-1.2 commits the draft on Enter and on blur when it changed', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(
      <>
        <InlineTextField value="A pear" aria-label="Caption" onCommit={onCommit} />
        <button type="button">Elsewhere</button>
      </>,
    );
    const input = screen.getByRole('textbox', { name: 'Caption' });
    await user.click(input);
    await user.tab();
    expect(onCommit).not.toHaveBeenCalled();
    await user.click(input);
    await user.type(input, ' and a plum');
    expect(input).toHaveAttribute('data-dirty', 'true');
    await user.keyboard('{Enter}');
    expect(onCommit).toHaveBeenLastCalledWith('A pear and a plum');
    await user.type(input, '!');
    await user.click(screen.getByRole('button', { name: 'Elsewhere' }));
    expect(onCommit).toHaveBeenLastCalledWith('A pear and a plum!');
  });

  it('UIC-INLINE-TEXT-FIELD-1.3 restores the committed text on Escape', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onCommit = vi.fn();
    render(
      <InlineTextField
        value="A pear"
        aria-label="Caption"
        onCancel={onCancel}
        onCommit={onCommit}
      />,
    );
    const input = screen.getByRole('textbox', { name: 'Caption' });
    await user.type(input, ' plum');
    await user.keyboard('{Escape}');
    expect(input).toHaveValue('A pear');
    expect(input).not.toHaveAttribute('data-dirty');
    expect(onCancel).toHaveBeenCalledOnce();
    await user.tab();
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('UIC-INLINE-TEXT-FIELD-1.2 commits once on Enter when the host moves focus in onCommit', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn(() => screen.getByRole('button', { name: 'Document' }).focus());
    render(<FocusReturningHost onCommit={onCommit} />);
    const input = screen.getByRole('textbox', { name: 'Caption' });
    await user.type(input, ' plum{Enter}');
    expect(screen.getByRole('button', { name: 'Document' })).toHaveFocus();
    expect(onCommit).toHaveBeenCalledOnce();
    expect(onCommit).toHaveBeenCalledWith('A pear plum');
  });

  it('UIC-INLINE-TEXT-FIELD-1.3 commits nothing on Escape when the host moves focus in onCancel', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const onCancel = vi.fn(() => screen.getByRole('button', { name: 'Document' }).focus());
    render(<FocusReturningHost onCommit={onCommit} onCancel={onCancel} />);
    const input = screen.getByRole('textbox', { name: 'Caption' });
    await user.type(input, ' plum{Escape}');
    expect(screen.getByRole('button', { name: 'Document' })).toHaveFocus();
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onCommit).not.toHaveBeenCalled();
    expect(input).toHaveValue('A pear');
    await user.type(input, '!');
    await user.tab();
    expect(onCommit).toHaveBeenCalledWith('A pear!');
  });

  it('UIC-INLINE-TEXT-FIELD-1.4 follows a new value unless the reader changed the draft', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<InlineTextField value="A pear" aria-label="Caption" />);
    const input = screen.getByRole('textbox', { name: 'Caption' });
    rerender(<InlineTextField value="A ripe pear" aria-label="Caption" />);
    expect(input).toHaveValue('A ripe pear');
    await user.type(input, '!');
    rerender(<InlineTextField value="A green pear" aria-label="Caption" />);
    expect(input).toHaveValue('A ripe pear!');
  });

  it('UIC-INLINE-TEXT-FIELD-1.4 takes the stored value after a commit the host normalised', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    function Trimming() {
      const [value, setValue] = useState('old');
      return (
        <>
          <InlineTextField
            value={value}
            aria-label="Caption"
            onCommit={(text) => {
              onCommit(text);
              setValue(text.trim());
            }}
          />
          <button type="button">Elsewhere</button>
        </>
      );
    }
    render(<Trimming />);
    const input = screen.getByRole('textbox', { name: 'Caption' });
    await user.clear(input);
    await user.type(input, 'new  {Enter}');
    expect(input).toHaveValue('new');
    expect(input).not.toHaveAttribute('data-dirty');
    await user.click(input);
    await user.click(screen.getByRole('button', { name: 'Elsewhere' }));
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  it('UIC-INLINE-TEXT-FIELD-1.5 keeps keys and clipboard events from the host around it', async () => {
    const user = userEvent.setup();
    const onHostEvent = vi.fn();
    const onCommit = vi.fn();
    render(
      <EditorHost
        value="A pear"
        aria-label="Caption"
        onCommit={onCommit}
        onHostEvent={onHostEvent}
      />,
    );
    const input = screen.getByRole('textbox', { name: 'Caption' });
    await user.click(input);
    await user.keyboard('{Control>}a{/Control}');
    expect(input).toHaveProperty('selectionStart', 0);
    expect(input).toHaveProperty('selectionEnd', 6);
    await user.paste('A plum');
    await user.keyboard('{Backspace}{Enter}{Escape}');
    expect(onHostEvent).not.toHaveBeenCalled();
    await user.keyboard('{Tab}');
    expect(onHostEvent).toHaveBeenCalledWith('keydown:Tab');
  });

  it('UIC-INLINE-TEXT-FIELD-1.6 shows a read-only text without committing', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<InlineTextField value="A pear" aria-label="Caption" isReadOnly onCommit={onCommit} />);
    const input = screen.getByRole('textbox', { name: 'Caption' });
    expect(input).toHaveAttribute('readonly');
    expect(input).toHaveAttribute('data-readonly', 'true');
    await user.type(input, 'x{Enter}');
    await user.tab();
    expect(input).toHaveValue('A pear');
    expect(onCommit).not.toHaveBeenCalled();
  });
});
