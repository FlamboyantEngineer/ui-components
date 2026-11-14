import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { expect, it } from 'vitest';
import {
  AssetPlacementComposition,
  CalendarEditorComposition,
  TimelineEditorComposition,
} from './composition-editors.js';
import { FormulaBarComposition, TableWorkflowComposition } from './composition-editors-grid.js';

it('UIC-CALENDAR-VIEW-5.2 saves a host-owned event title', async () => {
  const user = userEvent.setup();
  render(<CalendarEditorComposition />);
  await user.click(screen.getByRole('button', { name: /^Review,/ }));
  const dialog = await screen.findByRole('dialog', { name: 'Edit event' });
  const title = within(dialog).getByRole('textbox', { name: 'Title' });
  await user.clear(title);
  expect(within(dialog).getByRole('button', { name: 'Save' })).toBeDisabled();
  await user.type(title, 'Planning');
  await user.click(within(dialog).getByRole('button', { name: 'Save' }));
  expect(await screen.findByRole('button', { name: /^Planning,/ })).toBeInTheDocument();
});

it('UIC-TIMELINE-2.5 UIC-TIMELINE-2.6 saves a host-owned item form from its menu', async () => {
  const user = userEvent.setup();
  render(<TimelineEditorComposition />);
  const item = screen.getByRole('button', { name: 'Prepare' });
  item.focus();
  await user.keyboard('{Shift>}{F10}{/Shift}');
  const menu = await screen.findByRole('menu');
  await user.click(within(menu).getByRole('menuitem', { name: 'Edit' }));
  const dialog = await screen.findByRole('dialog', { name: 'Edit item' });
  const label = within(dialog).getByRole('textbox', { name: 'Label' });
  await user.clear(label);
  await user.type(label, 'Arrange');
  await user.click(within(dialog).getByRole('button', { name: 'Save' }));
  expect(await screen.findByRole('button', { name: 'Arrange' })).toBeInTheDocument();
});

it('UIC-ASSET-PICKER-1.2 gives the selected asset a host-owned placement', async () => {
  const user = userEvent.setup();
  render(<AssetPlacementComposition />);
  await user.click(await screen.findByRole('row', { name: 'Sample image' }));
  await user.click(screen.getByRole('button', { name: 'Insert' }));
  await user.type(screen.getByRole('textbox', { name: 'Alternative text' }), 'A sample');
  const width = screen.getByRole('textbox', { name: 'Width' });
  await user.clear(width);
  await user.type(width, '400');
  await user.tab();
  expect(screen.getByRole('textbox', { name: 'Height' })).toHaveValue('300');
  await user.click(screen.getByRole('button', { name: 'Place image' }));
  expect(screen.getByText('Sample image: A sample, 400 pixels, start')).toBeInTheDocument();
});

it('UIC-TABLE-15.1 UIC-TABLE-15.2 UIC-TABLE-16.3 UIC-TABLE-16.4 applies a host bulk action and previews the selected CSV rows', async () => {
  const user = userEvent.setup();
  render(<TableWorkflowComposition />);
  await user.click(within(screen.getByRole('row', { name: 'Maple' })).getByRole('checkbox'));
  await user.type(screen.getByRole('textbox', { name: 'Group for selected rows' }), 'Woodland');
  await user.click(screen.getByRole('button', { name: 'Set group' }));
  await user.click(screen.getByRole('button', { name: 'Export selected rows' }));
  const preview = screen.getByLabelText('CSV preview');
  expect(preview).toHaveTextContent('Maple,Woodland');
  expect(preview).not.toHaveTextContent('Mint');
});

it('UIC-TABLE-20.1 keeps raw source and reference state in the host', async () => {
  const user = userEvent.setup();
  render(<FormulaBarComposition />);
  await user.click(screen.getByRole('button', { name: 'Insert SUM' }));
  await user.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(screen.getByRole('textbox', { name: 'Raw cell content' })).toHaveValue('=SUM(A2:A4)');
  await user.click(screen.getByRole('button', { name: 'Apply' }));
  expect(screen.getByText('A1: =SUM(A2:A4)')).toBeInTheDocument();
});
