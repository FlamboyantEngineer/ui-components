import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState, type ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { Contents } from '../layout/wrappers.js';
import { Table } from '../table/table.js';
import { CodeEditor } from './code-editor.js';

const completions = [{ label: 'fruit.count' }, { label: 'fruit.ripe' }];

function SourceTable({ hasBoundary }: { hasBoundary: boolean }) {
  const [value, setValue] = useState('');
  const editor = (
    <CodeEditor
      variant="surface"
      aria-label="Source"
      value={value}
      onChange={setValue}
      completions={completions}
    />
  );
  const source = hasBoundary ? (
    <Contents
      onFocus={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      {editor}
    </Contents>
  ) : (
    editor
  );
  return (
    <Table<{ id: string; source: ReactNode }>
      aria-label="Sources"
      columns={[{ id: 'source', header: 'Source', renderCell: (row) => row.source }]}
      rows={[{ id: 'one', source }]}
    />
  );
}

describe('CodeEditor inside a collection', () => {
  it.each([false, true])(
    'UIC-CODE-EDITOR-4.2 UIC-COMPLETION-LIST-2.6 keeps typed completions through controlled cell updates with boundary %s',
    async (hasBoundary) => {
      const user = userEvent.setup();
      render(<SourceTable hasBoundary={hasBoundary} />);
      const source = screen.getByRole<HTMLTextAreaElement>('textbox', { name: 'Source' });
      await user.click(source);
      await user.keyboard('fru');
      expect(screen.getByRole('textbox', { name: 'Source' })).toBe(source);
      expect(source).toHaveValue('fru');
      expect(source).toHaveFocus();
      expect(source.selectionStart).toBe(3);
      await screen.findByRole('option', { name: 'fruit.count' });
      await user.keyboard('{Tab}');
      expect(source).toHaveValue('fruit.count');
      expect(source).toHaveFocus();
      expect(source.selectionStart).toBe('fruit.count'.length);
    },
  );
});
