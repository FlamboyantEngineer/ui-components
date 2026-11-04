import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { InfoGlyph, PlusGlyph, SaveGlyph, SearchGlyph } from '../../core/glyphs.js';
import { UiProvider } from '../../core/provider.js';
import { I18nProvider } from '../../primitives/index.js';
import { requireDefined } from '../../utils/require-defined.js';
import { Steps, type StepsItem } from './steps.js';

const items: StepsItem[] = [
  { id: 'upload', label: 'Upload', description: 'Choose a file' },
  { id: 'prepare', label: 'Prepare' },
  { id: 'review', label: 'Review', isOptional: true },
  { id: 'import', label: 'Import' },
];

function itemOf(label: string): HTMLElement {
  const item = screen
    .getAllByRole('listitem')
    .find((node) => node.querySelector('.ui-steps__label')?.textContent?.startsWith(label));
  if (!item) throw new Error(`No step ${label}`);
  return item;
}

describe('Steps', () => {
  it('UIC-STEPS-1.1 renders an ordered list with a marker, text and connector per step', () => {
    const { container } = render(<Steps items={items} currentKey="prepare" />);
    const list = screen.getByRole('list');
    expect(list.tagName).toBe('OL');
    expect(list).toHaveClass('ui-steps');
    const rows = within(list).getAllByRole('listitem');
    expect(rows).toHaveLength(4);
    for (const row of rows) {
      expect(row).toHaveClass('ui-steps__item');
      expect(row.querySelector('.ui-steps__step .ui-steps__marker')).not.toBeNull();
      expect(row.querySelector('.ui-steps__text .ui-steps__label')).not.toBeNull();
    }
    expect(container.querySelectorAll('.ui-steps__connector')).toHaveLength(3);
    expect(rows[3]?.querySelector('.ui-steps__connector')).toBeNull();
    expectHooksMatchSpec(container, 'STEPS', {
      slots: ['item', 'step', 'marker', 'text', 'label', 'optional', 'description', 'connector'],
    });
  });

  it('UIC-STEPS-1.2 reads each status from the current step unless the step sets its own', () => {
    const { rerender } = render(<Steps items={items} currentKey="review" />);
    const statuses = () =>
      screen.getAllByRole('listitem').map((row) => row.getAttribute('data-status'));
    expect(statuses()).toEqual(['complete', 'complete', 'current', 'upcoming']);
    rerender(
      <Steps
        items={[
          { ...requireDefined(items[0]), status: 'error' },
          { ...requireDefined(items[1]), status: 'skipped' },
          ...items.slice(2),
        ]}
        currentKey="review"
      />,
    );
    expect(statuses()).toEqual(['error', 'skipped', 'current', 'upcoming']);
    rerender(<Steps items={items} />);
    expect(statuses()).toEqual(['upcoming', 'upcoming', 'upcoming', 'upcoming']);
  });

  it('UIC-STEPS-1.3 marks the current step even when it failed', () => {
    const { container } = render(
      <Steps
        items={[requireDefined(items[0]), { ...requireDefined(items[1]), status: 'error' }]}
        currentKey="prepare"
      />,
    );
    const current = itemOf('Prepare');
    expect(current).toHaveAttribute('aria-current', 'step');
    expect(current).toHaveAttribute('data-current', 'true');
    expect(current).toHaveAttribute('data-status', 'error');
    expect(itemOf('Upload')).not.toHaveAttribute('aria-current');
    expect(itemOf('Upload')).not.toHaveAttribute('data-current');
    expectHooksMatchSpec(container, 'STEPS');
  });

  it('UIC-STEPS-1.4 draws a step icon until the step settles, then its status glyph', () => {
    const iconed: StepsItem[] = [
      { id: 'upload', label: 'Upload', icon: SaveGlyph },
      { id: 'prepare', label: 'Prepare', icon: SearchGlyph },
      { id: 'review', label: 'Review', icon: InfoGlyph },
      { id: 'import', label: 'Import', icon: PlusGlyph, status: 'error' },
    ];
    const { rerender } = render(<Steps items={iconed} currentKey="prepare" />);
    const marker = (label: string) => itemOf(label).querySelector('.ui-steps__marker');
    expect(marker('Upload')?.querySelector('[data-glyph="check"]')).not.toBeNull();
    expect(marker('Prepare')?.querySelector('[data-glyph="search"]')).not.toBeNull();
    expect(marker('Review')?.querySelector('[data-glyph="info"]')).not.toBeNull();
    expect(marker('Import')?.querySelector('[data-glyph="error"]')).not.toBeNull();
    for (const label of ['Upload', 'Prepare', 'Review', 'Import']) {
      expect(marker(label)).toHaveTextContent('');
      expect(marker(label)).toHaveAttribute('aria-hidden', 'true');
    }
    expect(itemOf('Prepare')).toHaveAttribute('aria-current', 'step');
    expect(itemOf('Upload')).toHaveTextContent('Upload Completed');
    rerender(<Steps items={iconed} isComplete />);
    for (const label of ['Upload', 'Prepare', 'Review', 'Import']) {
      expect(marker(label)?.querySelector('[data-glyph="check"]')).not.toBeNull();
    }
  });

  it('UIC-STEPS-1.4 shows numbers for open steps and glyphs for settled ones', () => {
    render(
      <I18nProvider locale="ar-EG">
        <Steps
          items={[
            requireDefined(items[0]),
            { ...requireDefined(items[1]), status: 'error' },
            { ...requireDefined(items[2]), status: 'skipped' },
            requireDefined(items[3]),
          ]}
          currentKey="import"
        />
      </I18nProvider>,
    );
    const marker = (label: string) => itemOf(label).querySelector('.ui-steps__marker');
    expect(marker('Upload')?.querySelector('[data-glyph="check"]')).not.toBeNull();
    expect(marker('Prepare')?.querySelector('[data-glyph="error"]')).not.toBeNull();
    expect(marker('Review')?.querySelector('[data-glyph="minus"]')).not.toBeNull();
    expect(marker('Import')).toHaveTextContent('٤');
    expect(marker('Import')).toHaveAttribute('aria-hidden', 'true');
  });

  it('UIC-STEPS-1.5 renders descriptions and optional marks', () => {
    render(
      <UiProvider messages={{ optional: 'May skip' }}>
        <Steps items={items} currentKey="upload" />
      </UiProvider>,
    );
    expect(itemOf('Upload').querySelector('.ui-steps__description')).toHaveTextContent(
      'Choose a file',
    );
    expect(itemOf('Review').querySelector('.ui-steps__optional')).toHaveTextContent('May skip');
    expect(itemOf('Prepare').querySelector('.ui-steps__optional')).toBeNull();
  });

  it('UIC-STEPS-1.6 publishes orientation and density, and compacts labels', () => {
    const { container, rerender } = render(<Steps items={items} currentKey="prepare" />);
    const list = screen.getByRole('list');
    expect(list).toHaveAttribute('data-orientation', 'horizontal');
    expect(list).toHaveAttribute('data-density', 'default');
    rerender(<Steps items={items} currentKey="prepare" orientation="vertical" density="compact" />);
    expect(list).toHaveAttribute('data-orientation', 'vertical');
    expect(list).toHaveAttribute('data-density', 'compact');
    expect(container.querySelector('.ui-steps__description')).toBeNull();
    expect(container.querySelector('.ui-steps__optional')).toBeNull();
    const label = (name: string) => itemOf(name).querySelector('.ui-steps__label') as HTMLElement;
    expect(label('Prepare').parentElement).toHaveClass('ui-steps__text');
    expect(label('Upload').parentElement).not.toHaveClass('ui-steps__text');
    expect(label('Upload').parentElement?.style.position).toBe('absolute');
    expect(screen.getAllByRole('listitem').map((row) => row.textContent)).toContain(
      'Upload Completed',
    );
    expectHooksMatchSpec(container, 'STEPS');
  });

  it('UIC-STEPS-1.7 forwards id, ref, class names and caller attributes', () => {
    const ref = createRef<HTMLOListElement>();
    const { container } = render(
      <Steps
        items={items}
        id="progress"
        ref={ref}
        className="host"
        data-density="caller"
        data-test="steps"
      />,
    );
    const list = screen.getByRole('list');
    expect(ref.current).toBe(list);
    expect(list).toHaveAttribute('id', 'progress');
    expect(list).toHaveClass('ui-steps', 'host');
    expect(list).toHaveAttribute('data-test', 'steps');
    expect(list).toHaveAttribute('data-density', 'default');
    expectHooksMatchSpec(container, 'STEPS', { callerAttributes: ['data-test'] });
  });

  it('UIC-STEPS-2.1 lets the reader return to settled steps', async () => {
    const user = userEvent.setup();

    const onAction = vi.fn();
    const { container } = render(
      <Steps
        items={[
          requireDefined(items[0]),
          { ...requireDefined(items[1]), status: 'skipped' },
          ...items.slice(2),
        ]}
        currentKey="review"
        onAction={onAction}
      />,
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons.map((button) => button.textContent)).toEqual([
      'Upload Completed Choose a file',
      'Prepare Skipped',
    ]);
    await user.click(requireDefined(buttons[0]));
    expect(onAction).toHaveBeenCalledWith('upload');
    await user.tab();
    expect(buttons[1]).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onAction).toHaveBeenLastCalledWith('prepare');
    expect(itemOf('Review').querySelector('button')).toBeNull();
    expect(itemOf('Import').querySelector('button')).toBeNull();
    expectHooksMatchSpec(container, 'STEPS');
  });

  it('UIC-STEPS-2.1 keeps steps as text without onAction', () => {
    render(<Steps items={items} currentKey="import" />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(itemOf('Upload').querySelector('.ui-steps__step')?.tagName).toBe('SPAN');
  });

  it('UIC-STEPS-2.2 refuses presses on disabled steps', async () => {
    const user = userEvent.setup();

    const onAction = vi.fn();
    const { container, rerender } = render(
      <Steps
        items={[{ ...requireDefined(items[0]), isDisabled: true }, ...items.slice(1)]}
        currentKey="review"
        onAction={onAction}
      />,
    );
    expect(itemOf('Upload')).toHaveAttribute('data-disabled', 'true');
    const upload = screen.getByRole('button', { name: 'Upload Completed Choose a file' });
    expect(upload).toBeDisabled();
    await user.click(upload);
    expect(onAction).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Prepare Completed' })).toBeEnabled();
    rerender(<Steps items={items} currentKey="review" onAction={onAction} isDisabled />);
    for (const button of screen.getAllByRole('button')) expect(button).toBeDisabled();
    expect(itemOf('Review')).toHaveAttribute('data-disabled', 'true');
    expectHooksMatchSpec(container, 'STEPS');
  });

  it('UIC-STEPS-2.3 publishes interaction states on pressable steps', async () => {
    const user = userEvent.setup();

    const { container } = render(<Steps items={items} currentKey="prepare" onAction={() => {}} />);
    const button = screen.getByRole('button', { name: 'Upload Completed Choose a file' });
    await user.hover(button);
    expect(button).toHaveAttribute('data-hovered', 'true');
    await user.unhover(button);
    await user.tab();
    expect(button).toHaveAttribute('data-focused', 'true');
    expect(button).toHaveAttribute('data-focus-visible', 'true');
    expectHooksMatchSpec(container, 'STEPS');
  });

  it('UIC-STEPS-3.1 names the list', () => {
    const { rerender } = render(<Steps items={items} />);
    expect(screen.getByRole('list', { name: 'Steps' })).toBeInTheDocument();
    rerender(<Steps items={items} aria-label="Import progress" />);
    expect(screen.getByRole('list', { name: 'Import progress' })).toBeInTheDocument();
    rerender(
      <>
        <h2 id="heading">New import</h2>
        <Steps items={items} aria-labelledby="heading" />
      </>,
    );
    expect(screen.getByRole('list', { name: 'New import' })).not.toHaveAttribute('aria-label');
  });

  it('UIC-STEPS-3.2 reads status words and describes pressable steps', () => {
    render(
      <UiProvider messages={{ stepStatus: '[{status}]' }}>
        <Steps
          items={[
            requireDefined(items[0]),
            { ...requireDefined(items[1]), status: 'error' },
            ...items.slice(2),
          ]}
          currentKey="review"
          onAction={() => {}}
        />
      </UiProvider>,
    );
    expect(
      screen.getByRole('button', { name: 'Upload [complete] Choose a file' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Prepare [error]' })).toBeInTheDocument();
    expect(itemOf('Review')).toHaveTextContent(/^3Review Optional$/);
    expect(itemOf('Review')).not.toHaveTextContent(/\[/);
  });
  it('UIC-STEPS-4.1 completes every step with no current step, including compact lists', () => {
    const items = [
      { id: 'one', label: 'Upload' },
      { id: 'two', label: 'Review' },
    ];
    const { container, rerender } = render(<Steps items={items} currentKey="two" isComplete />);
    expect(screen.getAllByRole('listitem').map((item) => item.getAttribute('data-status'))).toEqual(
      ['complete', 'complete'],
    );
    expect(container.querySelector('[aria-current]')).toBeNull();
    rerender(<Steps items={items} isComplete density="compact" />);
    expect(screen.getByRole('list')).toHaveAttribute('data-complete', 'true');
    expect(screen.getAllByRole('listitem').at(-1)?.textContent).toContain('Completed');
  });
});
