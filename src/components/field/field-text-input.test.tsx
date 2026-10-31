import { render, screen, within } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { CodeEditor } from '../code-editor/code-editor.js';
import { DateTimeField } from '../date-time-field/date-time-field.js';
import { NumberField } from '../number-field/number-field.js';
import { PortalContainerProvider } from '../portal/portal.js';
import { PinInput } from '../pin-input/pin-input.js';
import { RelativeDateField } from '../relative-date-field/relative-date-field.js';
import { SelectField } from '../select-field/select-field.js';
import { TagsInput } from '../tags-input/tags-input.js';
import { TextField } from '../text-field/text-field.js';

const text = { placeholder: 'Type here', enterKeyHint: 'next' } as const;

describe('Field text input props', () => {
  it.each<[string, ReactElement, 'textbox' | 'spinbutton']>([
    [
      'TextField',
      <TextField key="text" label="Fruit" autoComplete="nickname" {...text} />,
      'textbox',
    ],
    [
      'NumberField',
      <NumberField key="number" label="Fruit" autoComplete="nickname" {...text} />,
      'textbox',
    ],
    [
      'NumberField radix',
      <NumberField key="radix" label="Fruit" radix={16} autoComplete="nickname" {...text} />,
      'spinbutton',
    ],
    [
      'TagsInput',
      <TagsInput key="tags" label="Fruit" autoComplete="nickname" {...text} />,
      'textbox',
    ],
    [
      'PinInput',
      <PinInput key="pin" label="Fruit" length={4} autoComplete="nickname" {...text} />,
      'textbox',
    ],
  ])(
    'UIC-FIELD-8.3 %s hands placeholder, autoComplete and enterKeyHint to its input',
    (_, element, role) => {
      render(element);
      const [input] = screen.getAllByRole(role);
      expect(input).toHaveAttribute('placeholder', 'Type here');
      expect(input).toHaveAttribute('autocomplete', 'nickname');
      expect(input).toHaveAttribute('enterkeyhint', 'next');
    },
  );

  it('UIC-FIELD-8.3 keeps code free of autofill and spelling while taking the hint and Enter label', () => {
    render(<CodeEditor label="Query" {...text} />);
    const input = screen.getByRole('textbox', { name: 'Query' });
    expect(input).toHaveAttribute('placeholder', 'Type here');
    expect(input).toHaveAttribute('enterkeyhint', 'next');
    expect(input).toHaveAttribute('autocomplete', 'off');
    expect(input).toHaveAttribute('spellcheck', 'false');
  });

  it('UIC-FIELD-8.3 shows a relative date placeholder on its trigger', () => {
    render(<RelativeDateField label="Due" placeholder="Pick a day" />);
    expect(screen.getByRole('button', { name: /Pick a day/ })).toBeInTheDocument();
  });

  it('UIC-FIELD-8.3 sets spellcheck only when spellCheck is given', () => {
    render(
      <>
        <TextField label="Fruit" />
        <TextField label="Note" spellCheck />
      </>,
    );
    expect(screen.getByRole('textbox', { name: 'Fruit' })).not.toHaveAttribute('spellcheck');
    expect(screen.getByRole('textbox', { name: 'Note' })).toHaveAttribute('spellcheck', 'true');
  });

  it.each<[string, ReactElement, () => HTMLElement | undefined]>([
    [
      'NumberField',
      <NumberField key="number" label="Fruit" autoFocus />,
      () => screen.getByRole('textbox', { name: 'Fruit' }),
    ],
    [
      'PinInput',
      <PinInput key="pin" label="Fruit" length={4} autoFocus />,
      () => screen.getAllByRole('textbox')[0],
    ],
    [
      'TagsInput',
      <TagsInput key="tags" label="Fruit" autoFocus />,
      () => screen.getAllByRole('textbox')[0],
    ],
    [
      'CodeEditor',
      <CodeEditor key="code" label="Fruit" autoFocus />,
      () => screen.getByRole('textbox', { name: 'Fruit' }),
    ],
    [
      'SelectField',
      <SelectField
        key="select"
        label="Fruit"
        options={[{ id: 'pear', label: 'Pear' }]}
        autoFocus
      />,
      () => screen.getByRole('button', { name: /Fruit/ }),
    ],
    [
      'DateTimeField',
      <DateTimeField key="date" label="Fruit" autoFocus />,
      () => screen.getAllByRole('spinbutton')[0],
    ],
  ])('UIC-FIELD-8.3 %s focuses its control on mount with autoFocus', (_, element, control) => {
    render(element);
    expect(control()).toHaveFocus();
  });

  it('UIC-FIELD-8.3 takes focus from an element focused before the field mounts', () => {
    const view = render(<button type="button">Open</button>);
    screen.getByRole('button', { name: 'Open' }).focus();
    view.rerender(
      <>
        <button type="button">Open</button>
        <NumberField label="Fruit" autoFocus />
      </>,
    );
    expect(screen.getByRole('textbox', { name: 'Fruit' })).toHaveFocus();
  });

  it('UIC-FIELD-8.3 UIC-PORTAL-1.7 takes focus in another window from the element focused there before it mounts', () => {
    // A frame stands in for a popup window the host renders into through a portal container: it
    // keeps its own focused element while the script's document focuses another.
    const frame = document.body.appendChild(document.createElement('iframe'));
    const owner = frame.contentDocument;
    if (!owner) throw new Error('The frame has no document');
    const host = owner.body.appendChild(owner.createElement('div'));
    const elsewhere = document.body.appendChild(document.createElement('button'));
    const Popup = ({ field }: { field: boolean }) => (
      <PortalContainerProvider container={owner.body}>
        <button type="button">Open</button>
        {field ? <TagsInput label="Fruit" autoFocus /> : null}
      </PortalContainerProvider>
    );
    const view = render(<Popup field={false} />, { container: host });
    within(host).getByRole('button', { name: 'Open' }).focus();
    elsewhere.focus();
    view.rerender(<Popup field />);
    expect(owner.activeElement).toBe(within(host).getAllByRole('textbox')[0]);
    view.unmount();
    frame.remove();
    elsewhere.remove();
  });
});
