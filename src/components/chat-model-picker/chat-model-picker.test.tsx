import { StarGlyph } from '../../core/glyphs.js';
import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { installComposerRow } from '../../../test/composer-fixtures.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { collectPackages } from '../../../test/module-imports.js';
import { UiProvider } from '../../core/provider.js';
import { createMemoryStorage, type UiStorage } from '../../core/storage.js';
import { MessageComposer } from '../message-composer/message-composer.js';
import {
  ChatModelPicker,
  type ChatEffortOption,
  type ChatModelOption,
  type ChatModelPickerProps,
} from './chat-model-picker.js';

const efforts: ChatEffortOption[] = [
  { id: 'low', label: 'Low', description: 'Fastest replies' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High', description: 'Thinks longer' },
];

const models: ChatModelOption[] = [
  { id: 'swift', label: 'Swift', description: 'Quick answers', efforts: ['low', 'medium'] },
  { id: 'balanced', label: 'Balanced', description: 'Most work', defaultEffort: 'medium' },
  { id: 'deep', label: 'Deep', badge: 'New', efforts: ['medium', 'high'], defaultEffort: 'high' },
  { id: 'classic', label: 'Classic', efforts: [] },
  { id: 'max', label: 'Max', description: 'Big', isDisabled: true, disabledReason: 'Not here' },
];

const trigger = () => screen.getByRole('button', { name: /^Model:/ });

function renderPicker(props: Partial<ChatModelPickerProps> = {}) {
  const user = userEvent.setup();
  const onModelChange = vi.fn();
  const onEffortChange = vi.fn();
  const view = render(
    <ChatModelPicker
      models={models}
      efforts={efforts}
      onModelChange={onModelChange}
      onEffortChange={onEffortChange}
      {...props}
    />,
  );
  return { ...view, user, onModelChange, onEffortChange };
}

/** Opens the menu with a press and returns it once React Aria has shown it. */
async function openMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(trigger());
  return screen.findByRole('menu');
}

/** Chooses the item named `name` in the open menu, then waits until the menu has closed. */
async function choose(user: ReturnType<typeof userEvent.setup>, name: RegExp) {
  const menu = await openMenu(user);
  await user.click(within(menu).getByRole('menuitemradio', { name }));
  await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
}

function renderStored(storage: UiStorage, props: Partial<ChatModelPickerProps> = {}) {
  const user = userEvent.setup();
  const view = render(
    <UiProvider storage={storage}>
      <ChatModelPicker models={models} efforts={efforts} persistKey="composer-model" {...props} />
    </UiProvider>,
  );
  return { ...view, user };
}

describe('ChatModelPicker', () => {
  it('UIC-CHAT-MODEL-PICKER-1.1 ships from the package root without ProseMirror', () => {
    const root = readFileSync(join(process.cwd(), 'src/index.ts'), 'utf8');
    expect(root).toContain("export * from './components/chat-model-picker/index.js';");
    const entry = 'src/components/chat-model-picker/index.ts';
    expect(readFileSync(join(process.cwd(), entry), 'utf8')).toMatch(
      /export \{ ChatModelPicker \}/,
    );
    expect(collectPackages(entry).filter((name) => name.includes('prosemirror'))).toEqual([]);
  });

  it('UIC-CHAT-MODEL-PICKER-1.2 UIC-CHAT-MODEL-PICKER-1.4 shows the model and its effort on a named trigger', () => {
    const { container } = renderPicker({
      defaultModel: 'balanced',
      className: 'extra',
      id: 'picker',
      'data-testid': 'probe',
    });
    const root = container.querySelector('.ui-chat-model-picker');
    expect(root).toBe(trigger());
    expect(root).toHaveClass('ui-button', 'extra');
    expect(root).toHaveAttribute('id', 'picker');
    expect(root).toHaveAttribute('data-testid', 'probe');
    expect(root).toHaveAttribute('data-variant', 'ghost');
    expect(root).toHaveAttribute('data-size', 'sm');
    expect(root).toHaveAttribute('data-has-effort', 'true');
    expect(root).toHaveAttribute('aria-haspopup', 'true');
    expect(root).toHaveAttribute('aria-expanded', 'false');
    expect(root).toHaveAccessibleName('Model: Balanced, Medium effort');
    expect(root).toHaveTextContent('Balanced · Medium');
    expect(container.querySelector('.ui-chat-model-picker__model')).toHaveTextContent('Balanced');
    expect(container.querySelector('.ui-chat-model-picker__effort')).toHaveTextContent('Medium');
    expect(container.querySelector('.ui-button__end-icon')).toBeInTheDocument();
    expectHooksMatchSpec(container, 'CHAT-MODEL-PICKER', {
      slots: ['model', 'effort'],
      callerAttributes: ['data-testid'],
    });
  });

  it('UIC-CHAT-MODEL-PICKER-1.2 shows the model alone when it takes no effort, and nothing without models', () => {
    const { container, unmount } = renderPicker({ defaultModel: 'classic' });
    expect(trigger()).toHaveAccessibleName('Model: Classic');
    expect(trigger()).toHaveTextContent(/^Classic$/);
    expect(trigger()).not.toHaveAttribute('data-has-effort');
    expect(container.querySelector('.ui-chat-model-picker__effort')).toBeNull();
    unmount();
    renderPicker({ defaultModel: 'balanced', efforts: undefined });
    expect(trigger()).toHaveAccessibleName('Model: Balanced');
    const { container: empty } = render(<ChatModelPicker models={[]} efforts={efforts} />);
    expect(empty).toBeEmptyDOMElement();
  });

  it('UIC-CHAT-MODEL-PICKER-1.3 refuses to open while disabled', async () => {
    const { user } = renderPicker({ isDisabled: true });
    expect(trigger()).toBeDisabled();
    expect(trigger()).toHaveAttribute('data-disabled', 'true');
    await user.click(trigger());
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('UIC-CHAT-MODEL-PICKER-1.2 UIC-CHAT-MODEL-PICKER-2.2 draws a model icon on the trigger and in the menu', async () => {
    const { user } = renderPicker({
      models: models.map((model) => (model.id === 'swift' ? { ...model, icon: StarGlyph } : model)),
    });
    expect(trigger().querySelector('.ui-button__start-icon [data-glyph="star"]')).not.toBeNull();
    const menu = await openMenu(user);
    const swift = within(menu).getByRole('menuitemradio', { name: /^Swift/ });
    expect(swift.querySelector('[data-glyph="star"]')).not.toBeNull();
  });

  it('UIC-CHAT-MODEL-PICKER-1.5 shows its icon alone while the composer is compact and is disabled with it', () => {
    const row = installComposerRow();
    const picker = (pickerModels: ChatModelOption[]) => (
      <MessageComposer endControls={<ChatModelPicker models={pickerModels} efforts={efforts} />} />
    );
    const { container, rerender } = render(picker(models));
    row.resize(container, 100, 300);
    const root = container.querySelector('.ui-chat-model-picker');
    expect(root).toBe(trigger());
    expect(root).toHaveAttribute('data-compact', 'true');
    expect(trigger()).toHaveAttribute('data-content', 'icon');
    expect(trigger()).toHaveAccessibleName('Model: Swift, Low effort');
    expect(trigger().querySelector('[data-glyph="sparkles"]')).not.toBeNull();
    expectHooksMatchSpec(container, 'CHAT-MODEL-PICKER', { slots: [] });
    rerender(picker([{ id: 'deep', label: 'Deep', icon: StarGlyph }]));
    expect(trigger().querySelector('[data-glyph="star"]')).not.toBeNull();
    rerender(<MessageComposer isDisabled endControls={<ChatModelPicker models={models} />} />);
    expect(trigger()).toBeDisabled();
  });

  it('UIC-CHAT-MODEL-PICKER-2.1 UIC-CHAT-MODEL-PICKER-2.2 UIC-CHAT-MODEL-PICKER-2.3 lists the models, then the efforts the model takes', async () => {
    const { user } = renderPicker({ defaultModel: 'swift', defaultEffort: 'low' });
    const menu = await openMenu(user);
    expect(menu).toHaveClass('ui-menu', 'ui-chat-model-picker__menu');
    expect(menu).toHaveAccessibleName('Model: Swift, Low effort');
    const [modelGroup, effortGroup] = within(menu).getAllByRole('group');
    expect(modelGroup).toHaveAccessibleName('Model');
    expect(effortGroup).toHaveAccessibleName('Effort');
    const modelItems = within(modelGroup as HTMLElement).getAllByRole('menuitemradio');
    expect(modelItems.map((item) => item.textContent)).toEqual([
      'Swift Quick answers',
      'Balanced Most work',
      'Deep New',
      'Classic',
      'Max Not here',
    ]);
    expect(modelItems[0]).toBeChecked();
    for (const item of modelItems.slice(1)) expect(item).not.toBeChecked();
    const badge = modelItems[2]?.querySelector('.ui-badge');
    expect(badge).toHaveTextContent('New');
    expect(badge).toHaveAttribute('data-tone', 'info');
    expect(badge).toHaveAttribute('data-size', 'sm');
    const effortItems = within(effortGroup as HTMLElement).getAllByRole('menuitemradio');
    expect(effortItems.map((item) => item.textContent)).toEqual(['Low Fastest replies', 'Medium']);
    expect(effortItems[0]).toBeChecked();
    expectHooksMatchSpec(document.body, 'CHAT-MODEL-PICKER', {
      slots: ['model', 'effort', 'menu'],
    });
  });

  it('UIC-CHAT-MODEL-PICKER-2.4 UIC-CHAT-MODEL-PICKER-3.2 chooses an effort by pointer and closes the menu', async () => {
    const { user, onEffortChange, onModelChange } = renderPicker({ defaultModel: 'balanced' });
    await choose(user, /^High/);
    expect(onEffortChange).toHaveBeenCalledExactlyOnceWith('high');
    expect(onModelChange).not.toHaveBeenCalled();
    expect(trigger()).toHaveAccessibleName('Model: Balanced, High effort');
    await waitFor(() => expect(trigger()).toHaveFocus());
    await choose(user, /^High/);
    expect(onEffortChange).toHaveBeenCalledTimes(1);
  });

  it('UIC-CHAT-MODEL-PICKER-2.4 UIC-CHAT-MODEL-PICKER-3.1 chooses a model by keyboard and type-to-select', async () => {
    const { user, onModelChange, onEffortChange } = renderPicker({ defaultModel: 'balanced' });
    trigger().focus();
    await user.keyboard('{ArrowDown}');
    const menu = await screen.findByRole('menu');
    await waitFor(() =>
      expect(within(menu).getByRole('menuitemradio', { name: /^Swift/ })).toHaveFocus(),
    );
    await user.keyboard('d');
    expect(within(menu).getByRole('menuitemradio', { name: /^Deep/ })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onModelChange).toHaveBeenCalledExactlyOnceWith('deep');
    // Deep takes the current effort, so it stays without a report.
    expect(onEffortChange).not.toHaveBeenCalled();
    await waitFor(() => expect(trigger()).toHaveFocus());
    expect(trigger()).toHaveAccessibleName('Model: Deep, Medium effort');
    await user.keyboard('{ArrowUp}');
    const reopened = await screen.findByRole('menu');
    const high = within(reopened).getByRole('menuitemradio', { name: /^High/ });
    await waitFor(() => expect(high).toHaveFocus());
    await user.keyboard(' ');
    expect(onEffortChange).toHaveBeenCalledExactlyOnceWith('high');
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger()).toHaveFocus());
    await user.keyboard('{Enter}');
    await screen.findByRole('menu');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(trigger()).toHaveFocus());
    expect(onModelChange).toHaveBeenCalledTimes(1);
  });

  it('UIC-CHAT-MODEL-PICKER-3.2 moves the effort when the chosen model does not take it', async () => {
    const { user, onModelChange, onEffortChange } = renderPicker({
      defaultModel: 'balanced',
      defaultEffort: 'low',
    });
    await choose(user, /^Deep/);
    expect(onModelChange).toHaveBeenLastCalledWith('deep');
    expect(onEffortChange).toHaveBeenLastCalledWith('high');
    expect(trigger()).toHaveAccessibleName('Model: Deep, High effort');
    await choose(user, /^Swift/);
    expect(onEffortChange).toHaveBeenLastCalledWith('low');
    expect(trigger()).toHaveAccessibleName('Model: Swift, Low effort');
  });

  it('UIC-CHAT-MODEL-PICKER-2.1 UIC-CHAT-MODEL-PICKER-3.2 hides the efforts while the model takes none and keeps the held effort', async () => {
    const { user, onEffortChange } = renderPicker({
      defaultModel: 'classic',
      defaultEffort: 'high',
    });
    const menu = await openMenu(user);
    expect(within(menu).getAllByRole('group')).toHaveLength(1);
    expect(within(menu).queryByRole('group', { name: 'Effort' })).not.toBeInTheDocument();
    await user.click(within(menu).getByRole('menuitemradio', { name: /^Deep/ }));
    expect(onEffortChange).not.toHaveBeenCalled();
    expect(trigger()).toHaveAccessibleName('Model: Deep, High effort');
  });

  it('UIC-CHAT-MODEL-PICKER-2.2 UIC-CHAT-MODEL-PICKER-3.1 keeps an unavailable model listed with its reason, out of reach', async () => {
    const { user, onModelChange } = renderPicker({ defaultModel: 'max' });
    expect(trigger()).toHaveAccessibleName('Model: Swift, Low effort');
    trigger().focus();
    await user.keyboard('{ArrowDown}');
    const menu = await screen.findByRole('menu');
    await waitFor(() =>
      expect(within(menu).getByRole('menuitemradio', { name: /^Swift/ })).toHaveFocus(),
    );
    await user.keyboard('m');
    const max = within(menu).getByRole('menuitemradio', { name: 'Max Not here' });
    expect(max).toHaveFocus();
    expect(max).toHaveAttribute('aria-disabled', 'true');
    expect(max).toHaveAttribute('data-disabled', 'true');
    await user.keyboard('{Enter}');
    await user.click(max);
    expect(onModelChange).not.toHaveBeenCalled();
    expect(menu).toBeInTheDocument();
  });

  it('UIC-CHAT-MODEL-PICKER-3.1 UIC-CHAT-MODEL-PICKER-3.2 follows controlled values and reports the choices', async () => {
    const { user, onModelChange, onEffortChange, rerender } = renderPicker({
      model: 'balanced',
      effort: 'low',
    });
    await choose(user, /^Deep/);
    expect(onModelChange).toHaveBeenCalledExactlyOnceWith('deep');
    expect(onEffortChange).toHaveBeenCalledExactlyOnceWith('high');
    expect(trigger()).toHaveAccessibleName('Model: Balanced, Low effort');
    rerender(<ChatModelPicker models={models} efforts={efforts} model="deep" effort="low" />);
    // Deep does not take the controlled effort, so it shows its own default.
    expect(trigger()).toHaveAccessibleName('Model: Deep, High effort');
    rerender(<ChatModelPicker models={models} efforts={efforts} model="max" />);
    expect(trigger()).toHaveAccessibleName('Model: Max, Low effort');
  });

  it('UIC-CHAT-MODEL-PICKER-3.3 keeps the uncontrolled choice in the provider storage', async () => {
    const storage = createMemoryStorage();
    const { user, unmount } = renderStored(storage);
    expect(trigger()).toHaveAccessibleName('Model: Swift, Low effort');
    await choose(user, /^Deep/);
    expect(JSON.parse(storage.getItem('composer-model') ?? '')).toEqual({
      model: 'deep',
      effort: 'high',
    });
    unmount();
    renderStored(storage);
    expect(trigger()).toHaveAccessibleName('Model: Deep, High effort');
  });

  it('UIC-CHAT-MODEL-PICKER-3.3 falls back from a stored choice it cannot use', () => {
    const storage = createMemoryStorage({ 'composer-model': 'not json' });
    const { unmount } = renderStored(storage, { defaultModel: 'balanced' });
    expect(trigger()).toHaveAccessibleName('Model: Balanced, Medium effort');
    unmount();
    storage.setItem('composer-model', JSON.stringify({ model: 'gone', effort: 'high' }));
    renderStored(storage, { defaultModel: 'balanced' });
    expect(trigger()).toHaveAccessibleName('Model: Balanced, High effort');
  });

  it('UIC-CHAT-MODEL-PICKER-3.3 stores only the values the caller does not control', async () => {
    const storage = createMemoryStorage();
    const { user } = renderStored(storage, { model: 'swift' });
    await choose(user, /^Medium/);
    expect(trigger()).toHaveAccessibleName('Model: Swift, Medium effort');
    expect(JSON.parse(storage.getItem('composer-model') ?? '')).toEqual({ effort: 'medium' });
  });
});
