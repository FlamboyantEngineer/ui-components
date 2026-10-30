import { ListTaskGlyph } from '../../core/glyphs.js';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { installComposerRow } from '../../../test/composer-fixtures.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { MessageComposerToggle } from './composer-toggle.js';
import { MessageComposer } from './message-composer.js';

const plan = () => screen.getByRole('button', { name: 'Plan' });

describe('MessageComposerToggle', () => {
  it('UIC-MESSAGE-COMPOSER-8.1 flips an uncontrolled mode on each press and reports it', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <MessageComposer
        startControls={
          <MessageComposerToggle label="Plan" icon={ListTaskGlyph} onChange={onChange} />
        }
      />,
    );
    expect(plan()).toHaveClass('ui-button', 'ui-message-composer__toggle');
    expect(plan()).toHaveAttribute('data-variant', 'ghost');
    expect(plan()).toHaveTextContent('Plan');
    expect(plan().querySelector('.ui-button__start-icon [data-glyph="list-task"]')).not.toBeNull();
    expect(plan()).toHaveAttribute('aria-pressed', 'false');
    await user.click(plan());
    expect(plan()).toHaveAttribute('aria-pressed', 'true');
    expect(plan()).toHaveAttribute('data-selected', 'true');
    expect(onChange).toHaveBeenLastCalledWith(true);
    await user.click(plan());
    expect(onChange).toHaveBeenLastCalledWith(false);
    expectHooksMatchSpec(container, 'MESSAGE-COMPOSER', { slots: ['toggle'] });
  });

  it('UIC-MESSAGE-COMPOSER-8.1 follows a controlled state and starts from defaultSelected', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [isPlanning, setPlanning] = useState(true);
      return (
        <MessageComposerToggle
          label="Plan"
          icon={ListTaskGlyph}
          isSelected={isPlanning}
          onChange={setPlanning}
        />
      );
    }
    const { rerender } = render(<Controlled />);
    expect(plan()).toHaveAttribute('aria-pressed', 'true');
    await user.click(plan());
    expect(plan()).toHaveAttribute('aria-pressed', 'false');
    rerender(
      <MessageComposerToggle label="Plan" icon={ListTaskGlyph} defaultSelected key="fresh" />,
    );
    expect(plan()).toHaveAttribute('aria-pressed', 'true');
  });

  it('UIC-MESSAGE-COMPOSER-8.1 shows its icon alone while compact and is disabled with the composer', () => {
    const row = installComposerRow();
    const toggle = <MessageComposerToggle label="Plan" icon={ListTaskGlyph} />;
    const { container, rerender } = render(<MessageComposer startControls={toggle} />);
    row.resize(container, 80, 200);
    expect(plan()).toHaveAttribute('data-content', 'icon');
    expect(plan()).not.toHaveTextContent('Plan');
    expect(plan().querySelector('[data-glyph="list-task"]')).not.toBeNull();
    rerender(<MessageComposer isDisabled startControls={toggle} />);
    expect(plan()).toBeDisabled();
    rerender(<MessageComposerToggle label="Plan" icon={ListTaskGlyph} isDisabled />);
    expect(plan()).toBeDisabled();
  });
});
