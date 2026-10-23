import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Form } from '../form/form.js';
import { TextField } from '../text-field/text-field.js';
import { ProblemList, type ProblemListItem } from './problem-list.js';

const problems: ProblemListItem[] = [
  { id: 'title', message: 'Add a title.', label: 'Title', targetId: 'title-input' },
  { id: 'budget', message: 'The budget is unusually high.', label: 'Budget', severity: 'warning' },
  { id: 'links', message: 'Two links are broken.' },
];

function items(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>('.ui-problem-list__item'));
}

describe('ProblemList', () => {
  it('UIC-PROBLEM-LIST-1.2 keeps numeric and text IDs distinct when a problem is removed', () => {
    const entries: ProblemListItem[] = [
      { id: 1, message: 'Numeric problem' },
      { id: '1', message: 'Text problem' },
    ];
    const { rerender } = render(<ProblemList problems={entries} />);
    const textProblem = screen.getByText('Text problem');
    rerender(<ProblemList problems={entries.slice(1)} />);
    expect(screen.getByText('Text problem')).toBe(textProblem);
    expect(screen.queryByText('Numeric problem')).not.toBeInTheDocument();
  });

  it('UIC-PROBLEM-LIST-1.1 heads the problems and counts them by severity', () => {
    const { container, rerender } = render(
      <ProblemList problems={problems} data-test="problems" className="extra" id="summary" />,
    );
    const section = screen.getByRole('region', { name: 'Problems' });
    expect(section).toHaveClass('ui-problem-list', 'extra');
    expect(section).toHaveAttribute('id', 'summary');
    expect(section).toHaveAttribute('data-severity', 'error');
    expect(section).not.toHaveAttribute('data-empty');
    expect(screen.getByRole('heading', { name: 'Problems', level: 3 })).toHaveClass(
      'ui-problem-list__title',
    );
    expect(screen.getByRole('status')).toHaveTextContent('2 errors, 1 warning');
    expect(items(container).map((item) => item.getAttribute('data-severity'))).toEqual([
      'error',
      'warning',
      'error',
    ]);
    expectHooksMatchSpec(container, 'PROBLEM-LIST', { callerAttributes: ['data-test'] });
    rerender(<ProblemList problems={[problems[1] as ProblemListItem]} title="Checks" />);
    expect(screen.getByRole('region', { name: 'Checks' })).toHaveAttribute(
      'data-severity',
      'warning',
    );
    rerender(<ProblemList problems={[]} />);
    const empty = screen.getByRole('region', { name: 'Problems' });
    expect(empty).toHaveAttribute('data-empty', 'true');
    expect(empty).not.toHaveAttribute('data-severity');
    expect(screen.getByRole('status')).toHaveTextContent('No problems');
    expect(container.querySelector('.ui-problem-list__items')).toBeNull();
  });

  it('UIC-PROBLEM-LIST-1.2 shows the severity glyph and words, the label and the message', () => {
    const { container } = render(<ProblemList problems={problems} />);
    const [first, second, third] = items(container);
    expect(first?.querySelector('.ui-problem-list__icon [data-glyph="error"]')).not.toBeNull();
    expect(first).toHaveTextContent('Error: TitleAdd a title.');
    expect(first?.querySelector('.ui-problem-list__label')).toHaveTextContent('Title');
    expect(first?.querySelector('.ui-problem-list__message')).toHaveTextContent('Add a title.');
    expect(second?.querySelector('[data-glyph="warning"]')).not.toBeNull();
    expect(second).toHaveTextContent('Warning: BudgetThe budget is unusually high.');
    expect(third?.querySelector('.ui-problem-list__label')).toBeNull();
    expectHooksMatchSpec(container, 'PROBLEM-LIST', { slots: 'all' });
  });

  it('UIC-PROBLEM-LIST-1.3 moves focus to the target, then reports the problem', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const { container, rerender } = render(
      <>
        <ProblemList problems={problems} />
        <input id="title-input" aria-label="Title" />
      </>,
    );
    const [first, second] = items(container);
    expect(second?.querySelector('button')).toBeNull();
    await user.click(within(first as HTMLElement).getByRole('button'));
    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveFocus();
    rerender(
      <>
        <ProblemList problems={problems} onAction={onAction} />
        <input id="title-input" aria-label="Title" />
      </>,
    );
    const jumps = container.querySelectorAll('.ui-problem-list__jump');
    expect(jumps).toHaveLength(3);
    await user.click(jumps[1] as HTMLElement);
    expect(onAction).toHaveBeenCalledWith('budget');
  });

  it('UIC-PROBLEM-LIST-1.4 lists the problems a form fields show and follows them', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Form
        aria-label="Event"
        validationBehavior="aria"
        onSubmit={(event) => event.preventDefault()}
      >
        <ProblemList />
        <TextField label="Name" name="name" isRequired />
        <TextField
          label="Email"
          name="email"
          validate={(value) =>
            value.includes('@') ? null : { severity: 'warning', message: 'Check the address.' }
          }
        />
        <button type="submit">Save</button>
      </Form>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('No problems');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('status')).toHaveTextContent('1 error, 1 warning');
    expect(items(container).map((item) => item.textContent)).toEqual([
      'Error: NameA value is required.',
      'Warning: EmailCheck the address.',
    ]);
    await user.click(within(items(container)[1] as HTMLElement).getByRole('button'));
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveFocus();
    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'ana@example.com');
    expect(items(container)).toHaveLength(1);
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Ana');
    expect(screen.getByRole('status')).toHaveTextContent('No problems');
    expectHooksMatchSpec(container, 'PROBLEM-LIST');
  });

  it('UIC-PROBLEM-LIST-1.4 prefers given problems and stays empty outside a form', () => {
    const { rerender } = render(
      <Form aria-label="Event">
        <ProblemList problems={[problems[2] as ProblemListItem]} />
        <TextField label="Name" isRequired validationMode="immediate" />
      </Form>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('1 error');
    rerender(<ProblemList />);
    expect(screen.getByRole('status')).toHaveTextContent('No problems');
  });

  it('UIC-PROBLEM-LIST-2.1 keeps the count in a status region and reads severities as text', () => {
    const { container, rerender } = render(<ProblemList problems={problems} />);
    const status = screen.getByRole('status');
    expect(status).toHaveClass('ui-problem-list__summary');
    rerender(<ProblemList problems={[]} />);
    expect(screen.getByRole('status')).toBe(status);
    rerender(<ProblemList problems={problems} />);
    const glyph = container.querySelector('.ui-problem-list__icon');
    expect(glyph).toHaveAttribute('aria-hidden', 'true');
  });

  it('UIC-PROBLEM-LIST-2.2 carries its hooks and the caller attributes', () => {
    const { container } = render(<ProblemList problems={problems} data-test="problems" />);
    expect(container.querySelector('.ui-problem-list')).toHaveAttribute('data-test', 'problems');
    expectHooksMatchSpec(container, 'PROBLEM-LIST', { callerAttributes: ['data-test'] });
  });
});
