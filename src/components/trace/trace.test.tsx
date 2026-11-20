import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceDescription,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from './index.js';

it('UIC-TRACE-1.1 lays out lines with their status, icon, title and description', () => {
  const { container } = render(
    <Trace role="list" aria-label="Steps" data-testid="trace">
      <div role="listitem">
        <TraceLine>
          <TraceIcon>✓</TraceIcon>
          <TraceTitle>Read the schedule</TraceTitle> <TraceDescription>2s</TraceDescription>
        </TraceLine>
      </div>
      <div role="listitem">
        <a href="#log">
          <TraceLine status="error">
            <TraceTitle>Fetch the timetable</TraceTitle>
          </TraceLine>
        </a>
      </div>
      <div role="listitem">
        <TraceLine status="running">
          <TraceTitle>Compare the crossings</TraceTitle>
        </TraceLine>
      </div>
      <div role="listitem">
        <TraceLine status="pending">
          <TraceTitle>Write the summary</TraceTitle>
        </TraceLine>
      </div>
    </Trace>,
  );
  const trace = screen.getByRole('list', { name: 'Steps' });
  expect(trace).toHaveAttribute('data-testid', 'trace');
  const [done, failed, running, pending] = within(trace).getAllByRole('listitem');
  const lineOf = (item: HTMLElement | undefined) => item?.querySelector('.ui-trace__line');
  expect(lineOf(done)).not.toHaveAttribute('data-status');
  expect(lineOf(failed)).toHaveAttribute('data-status', 'error');
  expect(lineOf(running)).toHaveAttribute('data-status', 'running');
  expect(lineOf(pending)).toHaveAttribute('data-status', 'pending');
  expect(within(trace).getByRole('link')).toHaveAccessibleName('Fetch the timetable');
  expect(done?.querySelector('.ui-trace__icon')).toHaveAttribute('aria-hidden', 'true');
  expect(done).toHaveTextContent('Read the schedule 2s');
  expectHooksMatchSpec(container, 'TRACE', {
    slots: ['line', 'icon', 'title', 'description'],
    callerAttributes: ['data-testid'],
  });
});

it('UIC-TRACE-2.1 shows and hides a step’s details from its trigger', async () => {
  const user = userEvent.setup();
  const onExpandedChange = vi.fn();
  const { container } = render(
    <Trace>
      <TraceCollapsible onExpandedChange={onExpandedChange}>
        <TraceCollapsibleTrigger>
          <TraceLine>
            <TraceTitle>Thought</TraceTitle> <TraceDescription>4s</TraceDescription>
          </TraceLine>
        </TraceCollapsibleTrigger>
        <TraceCollapsibleContent>The ferry is faster than the bridge.</TraceCollapsibleContent>
      </TraceCollapsible>
    </Trace>,
  );
  const trigger = screen.getByRole('button', { name: 'Thought 4s' });
  const indicator = () => trigger.querySelector('.ui-trace__collapsible-indicator');
  expect(trigger).toHaveAttribute('aria-expanded', 'false');
  expect(indicator()).toHaveAttribute('data-glyph', 'chevron-right');
  const panel = container.querySelector('.ui-trace__collapsible-content');
  expect(panel).toHaveTextContent('The ferry is faster than the bridge.');
  expect(screen.queryByRole('group', { name: 'Thought 4s' })).not.toBeInTheDocument();
  await user.click(trigger);
  expect(onExpandedChange).toHaveBeenCalledWith(true);
  expect(trigger).toHaveAttribute('aria-expanded', 'true');
  expect(indicator()).toHaveAttribute('data-glyph', 'chevron-down');
  expect(screen.getByRole('group', { name: 'Thought 4s' })).toBe(panel);
  expectHooksMatchSpec(container, 'TRACE', {
    slots: [
      'line',
      'title',
      'description',
      'collapsible',
      'collapsible-trigger',
      'collapsible-indicator',
      'collapsible-content',
    ],
  });
});

it('UIC-TRACE-2.1 follows a controlled expanded state and a disabled trigger', () => {
  const { rerender } = render(
    <TraceCollapsible isExpanded isDisabled>
      <TraceCollapsibleTrigger>Ran tests</TraceCollapsibleTrigger>
      <TraceCollapsibleContent>All passed.</TraceCollapsibleContent>
    </TraceCollapsible>,
  );
  const trigger = screen.getByRole('button', { name: 'Ran tests' });
  expect(trigger).toHaveAttribute('aria-expanded', 'true');
  expect(trigger).toBeDisabled();
  rerender(
    <TraceCollapsible defaultExpanded={false}>
      <TraceCollapsibleTrigger>Ran tests</TraceCollapsibleTrigger>
      <TraceCollapsibleContent>All passed.</TraceCollapsibleContent>
    </TraceCollapsible>,
  );
  expect(screen.getByRole('button', { name: 'Ran tests' })).toBeEnabled();
});

it('UIC-TRACE-2.1 lets the content render its own panel element', () => {
  render(
    <TraceCollapsible defaultExpanded>
      <TraceCollapsibleTrigger>Thought</TraceCollapsibleTrigger>
      <TraceCollapsibleContent render={(props) => <div {...props} aria-busy="true" />}>
        Weighing the routes.
      </TraceCollapsibleContent>
    </TraceCollapsible>,
  );
  const panel = screen.getByRole('group', { name: 'Thought' });
  expect(panel).toHaveAttribute('aria-busy', 'true');
  expect(panel).toHaveClass('ui-trace__collapsible-content');
});
