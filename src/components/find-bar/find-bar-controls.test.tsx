import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Key } from '../../core/props.js';
import { FindBar } from './find-bar.js';

const options = [
  { id: 'case', label: 'Match case' },
  { id: 'words', label: 'Whole words' },
];

const replacementBox = () => screen.getByRole('textbox', { name: 'Replace with' });

describe('FindBar optional controls', () => {
  it('UIC-FIND-BAR-1.7 keeps the uncontrolled options while the menu is gone, and brings it back closed', async () => {
    const user = userEvent.setup();
    const onSelectedOptionsChange = vi.fn();
    const { rerender } = render(
      <FindBar options={options} onSelectedOptionsChange={onSelectedOptionsChange} />,
    );
    await user.click(screen.getByRole('button', { name: 'Find options' }));
    const menu = await screen.findByRole('menu', { name: 'Find options' });
    await user.click(within(menu).getByRole('menuitemcheckbox', { name: 'Match case' }));
    expect(onSelectedOptionsChange).toHaveBeenLastCalledWith(new Set<Key>(['case']));
    rerender(<FindBar options={[]} onSelectedOptionsChange={onSelectedOptionsChange} />);
    expect(screen.queryByRole('button', { name: 'Find options' })).not.toBeInTheDocument();
    rerender(<FindBar options={options} onSelectedOptionsChange={onSelectedOptionsChange} />);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Find options' }));
    const restored = await screen.findByRole('menu', { name: 'Find options' });
    expect(within(restored).getByRole('menuitemcheckbox', { name: 'Match case' })).toBeChecked();
    expect(onSelectedOptionsChange).toHaveBeenCalledTimes(1);
  });

  it('UIC-FIND-BAR-1.7 keeps the uncontrolled replacement while the replace handlers are gone', async () => {
    const user = userEvent.setup();
    const onReplace = vi.fn();
    const onReplacementChange = vi.fn();
    const { rerender } = render(
      <FindBar
        matchCount={2}
        defaultReplacement="Blue"
        onReplacementChange={onReplacementChange}
        onReplace={onReplace}
      />,
    );
    await user.clear(replacementBox());
    await user.type(replacementBox(), 'Kept');
    const reports = onReplacementChange.mock.calls.length;
    rerender(
      <FindBar
        matchCount={2}
        defaultReplacement="Blue"
        onReplacementChange={onReplacementChange}
      />,
    );
    expect(screen.queryByRole('textbox', { name: 'Replace with' })).not.toBeInTheDocument();
    rerender(
      <FindBar
        matchCount={2}
        defaultReplacement="Blue"
        onReplacementChange={onReplacementChange}
        onReplace={onReplace}
      />,
    );
    expect(replacementBox()).toHaveValue('Kept');
    await user.click(screen.getByRole('button', { name: 'Replace' }));
    expect(onReplace).toHaveBeenCalledWith('Kept');
    expect(onReplacementChange).toHaveBeenCalledTimes(reports);
  });

  it('UIC-FIND-BAR-1.7 shows controlled values as given when their controls return', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <FindBar
        options={options}
        selectedOptions={['words']}
        replacement="One"
        onReplace={vi.fn()}
      />,
    );
    rerender(<FindBar options={[]} selectedOptions={['case']} replacement="Two" />);
    rerender(
      <FindBar
        options={options}
        selectedOptions={['case']}
        replacement="Two"
        onReplace={vi.fn()}
      />,
    );
    expect(replacementBox()).toHaveValue('Two');
    await user.click(screen.getByRole('button', { name: 'Find options' }));
    const menu = await screen.findByRole('menu', { name: 'Find options' });
    expect(within(menu).getByRole('menuitemcheckbox', { name: 'Match case' })).toBeChecked();
    expect(within(menu).getByRole('menuitemcheckbox', { name: 'Whole words' })).not.toBeChecked();
  });
});
