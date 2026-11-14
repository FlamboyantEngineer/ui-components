import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  FolderCollectionRecipe,
  QueryCollectionRecipe,
  SnippetCollectionRecipe,
} from './composition-collections-editors.js';
import {
  NotificationCollectionRecipe,
  RevisionCollectionRecipe,
} from './composition-collections-feeds.js';
import {
  ConstraintCollectionRecipe,
  MappingCollectionRecipe,
  PermissionCollectionRecipe,
  ViewCollectionRecipe,
} from './composition-collections-options.js';

describe('Collection host recipes', () => {
  it('UIC-LABS-3.1 lets a host dismiss an update and keeps the next row usable', async () => {
    const user = userEvent.setup();
    render(<NotificationCollectionRecipe />);
    await user.click(screen.getByRole('button', { name: 'Dismiss Review ready' }));
    expect(screen.queryByText('Review ready')).not.toBeInTheDocument();
    expect(screen.getByRole('row', { name: /Export finished/ })).toBeVisible();
  });

  it('UIC-LABS-3.1 lets a host compare selected revisions', async () => {
    const user = userEvent.setup();
    render(<RevisionCollectionRecipe />);
    await user.click(screen.getByRole('row', { name: /Second draft/ }));
    await user.click(screen.getByRole('row', { name: /First draft/ }));
    await user.click(screen.getByRole('button', { name: 'Compare selected' }));
    expect(screen.getByRole('status')).toHaveTextContent('Comparing Second draft / First draft');
  });

  it('UIC-LABS-3.1 creates a collection through a generic async dialog', async () => {
    const user = userEvent.setup();
    render(<FolderCollectionRecipe />);
    await user.click(screen.getByRole('button', { name: 'Create collection' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByRole('textbox', { name: 'Collection name' }), 'Examples');
    await user.click(within(dialog).getByRole('button', { name: 'Create' }));
    expect(await screen.findByRole('row', { name: 'Examples' })).toBeVisible();
  });

  it('UIC-LABS-3.1 uses a generic editor to submit a host query', async () => {
    const user = userEvent.setup();
    render(<QueryCollectionRecipe />);
    await user.click(screen.getByRole('button', { name: 'Run query' }));
    expect(screen.getByRole('status', { name: 'Query result' })).toHaveTextContent(
      'Submitted: select title from entries',
    );
  });

  it('UIC-LABS-3.1 changes a host view without a workflow controller', async () => {
    const user = userEvent.setup();
    render(<ViewCollectionRecipe />);
    await user.click(screen.getByRole('button', { name: /Saved view/ }));
    await user.click(await screen.findByRole('option', { name: 'Grid' }));
    expect(screen.getByRole('status')).toHaveTextContent('Current view: Grid');
  });

  it('UIC-LABS-3.1 embeds independently operable access choices in a generic table', async () => {
    const user = userEvent.setup();
    render(<PermissionCollectionRecipe />);
    const choice = screen.getByRole('checkbox', { name: 'Reviewers can read' });
    await user.click(choice);
    expect(choice).toBeChecked();
  });

  it('UIC-LABS-3.1 exposes neutral mapping, bounds and source controls', () => {
    render(
      <>
        <MappingCollectionRecipe />
        <ConstraintCollectionRecipe />
        <SnippetCollectionRecipe />
      </>,
    );
    expect(screen.getByRole('grid', { name: 'Column assignments' })).toBeVisible();
    expect(screen.getByLabelText('Minimum')).toBeVisible();
    expect(screen.getByLabelText('Maximum')).toBeVisible();
    expect(screen.getByRole('button', { name: /Example source/ })).toBeVisible();
  });
});

it('UIC-LABS-3.1 saves and resets dirty saved-view state in the host', async () => {
  const user = userEvent.setup();
  render(<ViewCollectionRecipe />);
  await user.click(screen.getByRole('checkbox', { name: 'Compact rows' }));
  expect(screen.getByRole('status')).toHaveTextContent('(unsaved)');
  await user.click(screen.getByRole('button', { name: 'Reset view' }));
  expect(screen.getByRole('checkbox', { name: 'Compact rows' })).not.toBeChecked();
  await user.click(screen.getByRole('checkbox', { name: 'Compact rows' }));
  await user.click(screen.getByRole('button', { name: 'Save view' }));
  expect(screen.getByRole('status')).not.toHaveTextContent('(unsaved)');
  expect(screen.getByRole('button', { name: 'Reset view' })).toBeDisabled();
});

it('UIC-LABS-3.1 retains inherited grants while toggling editable permissions together', async () => {
  const user = userEvent.setup();
  render(<PermissionCollectionRecipe />);
  const inherited = screen.getByRole('checkbox', { name: 'Guests can read (inherited)' });
  expect(inherited).toBeChecked();
  await user.click(inherited);
  expect(inherited).toBeChecked();
  await user.click(screen.getByRole('checkbox', { name: 'All editable permissions' }));
  expect(screen.getByRole('checkbox', { name: 'Reviewers can write' })).toBeChecked();
});
