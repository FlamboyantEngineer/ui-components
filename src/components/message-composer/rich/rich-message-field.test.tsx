import { render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { installEditorDom } from '../../../../test/rich-text-fixtures.js';
import { emptyMessage, type MessageComposerMessage } from '../composer-message.js';
import { RichMessageField } from './rich-message-composer.js';

installEditorDom();

function Field({ autoFocus }: { autoFocus?: boolean }) {
  const [value, setValue] = useState<MessageComposerMessage>(emptyMessage);
  return (
    <RichMessageField aria-label="Reply" value={value} onChange={setValue} autoFocus={autoFocus} />
  );
}

/** A host that mounts the field a render after its own mount, as a lazily opened panel does. */
function LateHost() {
  const [isOpen, setOpen] = useState(false);
  return (
    <div ref={(element) => (element && !isOpen ? setOpen(true) : undefined)}>
      {isOpen ? <Field autoFocus /> : null}
    </div>
  );
}

describe('RichMessageField', () => {
  it('UIC-MESSAGE-COMPOSER-4.14 focuses its editable on mount with autoFocus', async () => {
    render(<Field autoFocus />);
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Reply' })).toHaveFocus());
  });

  it('UIC-MESSAGE-COMPOSER-4.14 focuses an editable that mounts after its host', async () => {
    render(<LateHost />);
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Reply' })).toHaveFocus());
  });

  it('UIC-MESSAGE-COMPOSER-4.14 leaves focus where it is without autoFocus', async () => {
    render(<Field />);
    const box = await screen.findByRole('textbox', { name: 'Reply' });
    expect(box).not.toHaveFocus();
  });
});
