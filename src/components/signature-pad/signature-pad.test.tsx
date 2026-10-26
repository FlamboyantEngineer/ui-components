import { act, fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { requireDefined } from '../../utils/require-defined.js';
import { Form } from '../form/form.js';
import { SignaturePad, type DrawnSignature, type SignatureValue } from './signature-pad.js';

const drawing: DrawnSignature = {
  kind: 'drawn',
  width: 600,
  height: 200,
  paths: ['M10 10 L50 40', 'M60 20 L90 20'],
};

function root(container: HTMLElement) {
  return requireDefined(container.querySelector<HTMLElement>('.ui-field'));
}

function surface() {
  return screen.getByRole('img');
}

function canvas(container: HTMLElement) {
  const element = requireDefined(
    container.querySelector<SVGSVGElement>('.ui-signature-pad__canvas'),
  );
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
    left: 100,
    top: 50,
    width: 300,
    height: 100,
    right: 400,
    bottom: 150,
    x: 100,
    y: 50,
    toJSON: () => ({}),
  });
  Object.assign(element, { setPointerCapture: vi.fn() });
  return element;
}

function strokes(container: HTMLElement) {
  return Array.from(container.querySelectorAll('.ui-signature-pad__stroke'), (path) =>
    path.getAttribute('d'),
  );
}

type PointerType = 'pointerDown' | 'pointerMove' | 'pointerUp' | 'pointerCancel';

function pointer(type: PointerType, target: Element, init: PointerEventInit = {}) {
  fireEvent[type](target, { pointerId: 1, button: 0, isPrimary: true, ...init });
}

/** Draws one stroke through canvas positions given in client pixels. */
function drawStroke(target: Element, points: Array<[number, number]>) {
  const [first, ...rest] = points;
  pointer('pointerDown', target, {
    clientX: requireDefined(first)[0],
    clientY: requireDefined(first)[1],
  });
  for (const [clientX, clientY] of rest.slice(0, -1)) {
    pointer('pointerMove', target, { clientX, clientY });
  }
  const last = rest.at(-1) ?? requireDefined(first);
  pointer('pointerUp', target, { clientX: last[0], clientY: last[1] });
}

function Controlled({ initial }: { initial: SignatureValue | null }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <SignaturePad label="Signature" value={value} onChange={setValue} />
      <output>{JSON.stringify(value)}</output>
    </>
  );
}

describe('SignaturePad', () => {
  it('UIC-SIGNATURE-PAD-1.1 is a field that starts empty in the draw mode', () => {
    const { container } = render(<SignaturePad label="Signature" />);
    expect(root(container)).toHaveClass('ui-field', 'ui-signature-pad');
    expect(root(container)).toHaveAttribute('data-mode', 'draw');
    expect(root(container)).not.toHaveAttribute('data-filled');
    expect(strokes(container)).toEqual([]);
    expectHooksMatchSpec(container, 'SIGNATURE-PAD', {
      slots: ['modes', 'surface', 'canvas', 'actions'],
    });
  });

  it('UIC-SIGNATURE-PAD-1.2 names the drawing area by the label and describes it by its strokes', () => {
    const { container } = render(
      <SignaturePad label="Signature" description="Sign inside the box." defaultValue={drawing} />,
    );
    const area = screen.getByRole('img', { name: 'Signature' });
    expect(area).toHaveClass('ui-signature-pad__surface');
    expect(area).toHaveAttribute('tabindex', '-1');
    expect(area).toHaveAccessibleDescription('Drawing area, 2 strokes Sign inside the box.');
    const label = container.querySelector('label');
    expect(label).toHaveAttribute('for', area.id);
    const svg = area.querySelector('svg');
    expect(svg).toHaveClass('ui-signature-pad__canvas');
    expect(svg).toHaveAttribute('viewBox', '0 0 600 200');
    expect(svg).toHaveAttribute('preserveAspectRatio', 'none');
    expect(svg).toHaveStyle({ touchAction: 'none', width: '100%', height: '100%' });
    const path = container.querySelector('.ui-signature-pad__stroke');
    expect(path).toHaveAttribute('fill', 'none');
    expect(path).toHaveAttribute('stroke', 'currentColor');
    expect(path).toHaveAttribute('stroke-linecap', 'round');
    expect(path).toHaveAttribute('vector-effect', 'non-scaling-stroke');
    expect(strokes(container)).toEqual(drawing.paths);
    expectHooksMatchSpec(container, 'SIGNATURE-PAD', { slots: ['surface', 'canvas', 'stroke'] });

    const { container: other } = render(
      <SignaturePad label="Initials" labelLayout="control-only" />,
    );
    const empty = other.querySelector('.ui-signature-pad__surface');
    expect(empty).toHaveAttribute('aria-label', 'Initials');
    expect(empty).toHaveAccessibleDescription('Drawing area, empty');
  });

  it('UIC-SIGNATURE-PAD-2.1 draws strokes mapped to the drawing space and commits each one', () => {
    const onChange = vi.fn();
    const onCommit = vi.fn();
    const { container } = render(
      <SignaturePad label="Signature" onChange={onChange} onCommit={onCommit} />,
    );
    const target = canvas(container);
    pointer('pointerDown', target, { clientX: 110, clientY: 60 });
    expect(target.setPointerCapture).toHaveBeenCalledWith(1);
    expect(surface()).toHaveAttribute('data-drawing', 'true');
    pointer('pointerMove', target, { clientX: 130, clientY: 80 });
    pointer('pointerMove', target, { clientX: 2, clientY: 80 });
    pointer('pointerMove', target, { clientX: 150, clientY: 80, pointerId: 2 });
    expect(strokes(container)).toEqual(['M20 20 Q60 60 30 60 L0 60']);
    expect(onChange).not.toHaveBeenCalled();
    pointer('pointerUp', target, { clientX: 500, clientY: 500 });
    expect(surface()).not.toHaveAttribute('data-drawing');
    const value = {
      kind: 'drawn',
      width: 600,
      height: 200,
      paths: ['M20 20 Q60 60 30 60 Q0 60 300 130 L600 200'],
    };
    expect(onChange).toHaveBeenLastCalledWith(value);
    expect(onCommit).toHaveBeenLastCalledWith(value);
    expect(root(container)).toHaveAttribute('data-filled', 'true');
    expect(surface()).toHaveAccessibleDescription('Drawing area, 1 stroke');

    drawStroke(target, [[200, 100]]);
    expect(onChange).toHaveBeenLastCalledWith({
      ...value,
      paths: [...value.paths, 'M200 100 L200 100'],
    });
  });

  it.each(['isDisabled', 'isReadOnly'] as const)(
    'UIC-SIGNATURE-PAD-1.4 UIC-SIGNATURE-PAD-2.1 drops the live stroke when %s changes during drawing',
    async (lock) => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const onCommit = vi.fn();
      const props = { label: 'Signature', onChange, onCommit };
      const { container, rerender } = render(<SignaturePad {...props} />);
      const target = canvas(container);
      const release = vi.fn();
      Object.assign(target, { hasPointerCapture: () => true, releasePointerCapture: release });
      await user.pointer([
        { keys: '[MouseLeft>]', target, coords: { clientX: 110, clientY: 60 } },
        { coords: { clientX: 130, clientY: 80 } },
      ]);
      expect(surface()).toHaveAttribute('data-drawing', 'true');
      expect(strokes(container)).toHaveLength(1);
      rerender(<SignaturePad {...props} {...{ [lock]: true }} />);
      expect(release).toHaveBeenCalledTimes(1);
      expect(surface()).not.toHaveAttribute('data-drawing');
      expect(strokes(container)).toEqual([]);
      rerender(<SignaturePad {...props} />);
      await user.pointer([{ coords: { clientX: 150, clientY: 90 } }, { keys: '[/MouseLeft]' }]);
      expect(strokes(container)).toEqual([]);
      expect(onChange).not.toHaveBeenCalled();
      expect(onCommit).not.toHaveBeenCalled();
    },
  );

  it('UIC-SIGNATURE-PAD-2.1 ignores other buttons, drops cancelled strokes and keeps a drawing space', () => {
    const onChange = vi.fn();
    const { container } = render(
      <SignaturePad
        label="Signature"
        defaultValue={{ kind: 'drawn', width: 300, height: 100, paths: ['M1 1 L2 2'] }}
        onChange={onChange}
      />,
    );
    const target = canvas(container);
    pointer('pointerDown', target, { clientX: 150, clientY: 70, button: 2 });
    expect(surface()).not.toHaveAttribute('data-drawing');
    pointer('pointerDown', target, { clientX: 150, clientY: 70 });
    pointer('pointerMove', target, { clientX: 200, clientY: 90 });
    pointer('pointerCancel', target);
    expect(strokes(container)).toEqual(['M1 1 L2 2']);
    expect(onChange).not.toHaveBeenCalled();
    drawStroke(target, [
      [150, 70],
      [250, 90],
    ]);
    expect(onChange).toHaveBeenLastCalledWith({
      kind: 'drawn',
      width: 300,
      height: 100,
      paths: ['M1 1 L2 2', 'M50 20 L150 40'],
    });
  });

  it('UIC-SIGNATURE-PAD-2.3 undoes the last stroke and clears the drawing', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<SignaturePad label="Signature" defaultValue={drawing} onCommit={onCommit} />);
    const undo = screen.getByRole('button', { name: 'Undo stroke' });
    const clear = screen.getByRole('button', { name: 'Clear' });
    await user.click(undo);
    expect(onCommit).toHaveBeenLastCalledWith({ ...drawing, paths: [drawing.paths[0]] });
    await user.click(undo);
    expect(onCommit).toHaveBeenLastCalledWith(null);
    expect(undo).toBeDisabled();
    expect(clear).toBeDisabled();
    render(<SignaturePad label="Second" defaultValue={drawing} onCommit={onCommit} />);
    await user.click(requireDefined(screen.getAllByRole('button', { name: 'Clear' })[1]));
    expect(onCommit).toHaveBeenLastCalledWith(null);
  });

  it('UIC-SIGNATURE-PAD-3.1 switches between drawing and typing, emptying a value of the other mode', async () => {
    const user = userEvent.setup();
    const { container } = render(<Controlled initial={drawing} />);
    const choice = screen.getByRole('radiogroup', { name: 'Signature method' });
    expect(choice).toHaveClass('ui-signature-pad__modes', 'ui-segmented-choice');
    await user.click(screen.getByRole('radio', { name: 'Type' }));
    expect(root(container)).toHaveAttribute('data-mode', 'type');
    expect(screen.getByText('null', { selector: 'output' })).toBeInTheDocument();
    await user.type(screen.getByRole('textbox', { name: 'Signature' }), 'Ada');
    await user.click(screen.getByRole('radio', { name: 'Draw' }));
    expect(root(container)).toHaveAttribute('data-mode', 'draw');
    expect(screen.getByText('null', { selector: 'output' })).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'Type' }));
    await user.click(screen.getByRole('radio', { name: 'Draw' }));
    expect(root(container)).toHaveAttribute('data-mode', 'draw');

    const { container: typed } = render(
      <SignaturePad
        label="Name"
        allowsTyping={false}
        defaultValue={{ kind: 'typed', text: 'Bo' }}
      />,
    );
    expect(typed.querySelector('.ui-signature-pad__modes')).toBeNull();
    expect(root(typed)).toHaveAttribute('data-mode', 'type');
    const { container: plain } = render(<SignaturePad label="Plain" allowsTyping={false} />);
    expect(plain.querySelector('.ui-signature-pad__modes')).toBeNull();
    expect(root(plain)).toHaveAttribute('data-mode', 'draw');
  });

  it('UIC-SIGNATURE-PAD-3.2 UIC-FIELD-1.11 types the name, with blank text as no signature, committing on Enter and on leaving the field', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onCommit = vi.fn();
    const { container } = render(
      <SignaturePad
        label="Signature"
        isRequired
        defaultValue={{ kind: 'typed', text: '' }}
        onChange={onChange}
        onCommit={onCommit}
      />,
    );
    const input = screen.getByRole('textbox', { name: 'Signature' });
    expect(input).toHaveClass('ui-signature-pad__input');
    expect(input).toHaveAttribute('autocomplete', 'name');
    expect(input).toHaveAttribute('placeholder', 'Type your name');
    expect(input).toBeRequired();
    await user.type(input, 'Ada L');
    expect(onChange).toHaveBeenLastCalledWith({ kind: 'typed', text: 'Ada L' });
    await user.keyboard('{Enter}');
    expect(onCommit).toHaveBeenLastCalledWith({ kind: 'typed', text: 'Ada L' });
    await user.clear(input);
    await user.type(input, '  ');
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(input).toHaveValue('');
    // Tab from the edited input reaches the restore button; leaving the field commits.
    await user.tab();
    expect(screen.getByRole('button', { name: 'Restore Signature' })).toHaveFocus();
    expect(onCommit).toHaveBeenCalledTimes(1);
    await user.tab();
    expect(onCommit).toHaveBeenLastCalledWith(null);
    expectHooksMatchSpec(container, 'SIGNATURE-PAD', { slots: ['modes', 'input'] });
  });

  it('UIC-SIGNATURE-PAD-3.3 validates, restores, undoes and clears through the field', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <SignaturePad
        label="Signature"
        isRequired
        validationMode="immediate"
        committedValue={drawing}
        defaultValue={drawing}
        menu={['clear']}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Undo stroke' }));
    expect(root(container)).toHaveAttribute('data-dirty', 'true');
    await user.click(screen.getByRole('button', { name: /^Restore/ }));
    expect(strokes(container)).toEqual(drawing.paths);
    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(root(container)).toHaveAttribute('data-validation', 'invalid');
    expect(surface()).toHaveAttribute('aria-invalid', 'true');
    expect(surface()).toHaveAccessibleDescription('Drawing area, empty A value is required.');
    act(() => surface().focus());
    await user.keyboard('{Control>}z{/Control}');
    expect(strokes(container)).toEqual(drawing.paths);
  });

  it('UIC-SIGNATURE-PAD-1.3 submits the value as JSON under its name', async () => {
    const user = userEvent.setup();
    const submitted: Array<FormDataEntryValue | null> = [];
    const { container, rerender } = render(
      <Form
        aria-label="Sign"
        onSubmit={(event) => {
          event.preventDefault();
          submitted.push(new FormData(event.currentTarget).get('signature'));
        }}
      >
        <SignaturePad label="Signature" name="signature" defaultValue={drawing} />
        <button type="submit">Send</button>
      </Form>,
    );
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(submitted).toEqual([JSON.stringify(drawing)]);
    rerender(
      <Form aria-label="Sign" onSubmit={(event) => event.preventDefault()}>
        <SignaturePad label="Signature" name="signature" defaultValue={drawing} isDisabled />
      </Form>,
    );
    expect(container.querySelector('input[type="hidden"]')).toBeDisabled();
  });

  it('UIC-SIGNATURE-PAD-1.4 shows the signature but refuses changes while read-only or disabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container, unmount } = render(
      <SignaturePad label="Signature" defaultValue={drawing} isReadOnly onChange={onChange} />,
    );
    drawStroke(canvas(container), [
      [120, 60],
      [180, 90],
    ]);
    expect(strokes(container)).toEqual(drawing.paths);
    expect(screen.getByRole('button', { name: 'Undo stroke' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled();
    await user.click(screen.getByRole('radio', { name: 'Type' }));
    expect(root(container)).toHaveAttribute('data-mode', 'draw');
    expect(onChange).not.toHaveBeenCalled();
    unmount();
    render(<SignaturePad label="Name" defaultValue={{ kind: 'typed', text: 'Ada' }} isDisabled />);
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'Draw' })).toBeDisabled();
  });

  it('UIC-SIGNATURE-PAD-1.5 appends the caller class and forwards id and data attributes', () => {
    const { container } = render(
      <SignaturePad label="Signature" className="caller" id="sign" data-testid="probe" />,
    );
    expect(root(container)).toHaveClass('ui-signature-pad', 'caller');
    expect(root(container)).toHaveAttribute('id', 'sign');
    expect(root(container)).toHaveAttribute('data-testid', 'probe');
    expect(surface()).toHaveAttribute('id', 'sign-control');
    expectHooksMatchSpec(container, 'SIGNATURE-PAD', { callerAttributes: ['data-testid'] });
  });
});
