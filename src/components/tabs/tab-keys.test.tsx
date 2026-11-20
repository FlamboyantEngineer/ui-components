import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  Tabs,
  TabsContent,
  TabsList,
  type TabsListProps,
  type TabsProps,
  TabsTrigger,
  type TabsTriggerProps,
} from './tabs.js';

function TypedTabs({ list, ...props }: TabsProps & { list?: Partial<TabsListProps> }) {
  return (
    <Tabs {...props}>
      <TabsList aria-label="Typed tabs" {...list}>
        <TabsTrigger id={1}>Numeric</TabsTrigger>
        <TabsTrigger id="1">Text</TabsTrigger>
        <TabsTrigger id="a b">Spaced</TabsTrigger>
        <TabsTrigger id="ab">Compact</TabsTrigger>
      </TabsList>
      <TabsContent id={1}>Numeric panel</TabsContent>
      <TabsContent id="1">Text panel</TabsContent>
      <TabsContent id="a b">Spaced panel</TabsContent>
      <TabsContent id="ab">Compact panel</TabsContent>
    </Tabs>
  );
}

/** A host component around `TabsTrigger`, as React Aria's reuse pattern writes it. */
function NamedTab(props: TabsTriggerProps) {
  return <TabsTrigger {...props} />;
}

describe('Tab key identities', () => {
  it('UIC-TABS-1.1 UIC-TABS-2.1 pairs panels rendered through a host component with their typed tabs', async () => {
    const user = userEvent.setup();
    function Panels() {
      return (
        <>
          <TabsContent id={1}>Numeric panel</TabsContent>
          <TabsContent id="1">Text panel</TabsContent>
        </>
      );
    }
    render(
      <Tabs>
        <TabsList aria-label="Wrapped panels">
          <TabsTrigger id={1}>Numeric</TabsTrigger>
          <TabsTrigger id="1">Text</TabsTrigger>
        </TabsList>
        <Panels />
      </Tabs>,
    );
    const numeric = screen.getByRole('tab', { name: 'Numeric' });
    expect(numeric).toHaveAttribute(
      'aria-controls',
      screen.getByRole('tabpanel', { name: 'Numeric' }).id,
    );
    await user.click(screen.getByRole('tab', { name: 'Text' }));
    const textPanel = screen.getByRole('tabpanel', { name: 'Text' });
    expect(textPanel).toHaveTextContent('Text panel');
    expect(screen.getByRole('tab', { name: 'Text' })).toHaveAttribute(
      'aria-controls',
      textPanel.id,
    );
  });

  it('UIC-TABS-2.2 treats a disabled-key string as an iterable of keys', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <Tabs disabledKeys="all" defaultSelectedKey="rest" onSelectionChange={onSelectionChange}>
        <TabsList aria-label="Letters">
          <TabsTrigger id="a">Letter A</TabsTrigger>
          <TabsTrigger id="l">Letter L</TabsTrigger>
          <TabsTrigger id="all">All</TabsTrigger>
          <TabsTrigger id="rest">Rest</TabsTrigger>
        </TabsList>
      </Tabs>,
    );
    await user.click(screen.getByRole('tab', { name: 'Letter A' }));
    await user.click(screen.getByRole('tab', { name: 'Letter L' }));
    expect(onSelectionChange).not.toHaveBeenCalled();
    await user.click(screen.getByRole('tab', { name: 'All' }));
    expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith('all');
  });

  it('UIC-TABS-1.1 UIC-TABS-2.1 keeps typed and whitespace IDs separate in selection and ARIA relationships', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(<TypedTabs onSelectionChange={onSelectionChange} />);
    const tabs = screen.getAllByRole('tab');
    expect(new Set(tabs.map((tab) => tab.id)).size).toBe(4);
    for (const [name, key] of [
      ['Text', '1'],
      ['Numeric', 1],
      ['Compact', 'ab'],
      ['Spaced', 'a b'],
    ] as const) {
      const tab = screen.getByRole('tab', { name });
      await user.click(tab);
      expect(onSelectionChange).toHaveBeenLastCalledWith(key);
      expect(screen.getByRole('tabpanel', { name })).toHaveTextContent(`${name} panel`);
      expect(tab).toHaveAttribute('aria-controls', screen.getByRole('tabpanel', { name }).id);
    }
  });

  it('UIC-TABS-2.2 disables a numeric ID without disabling the matching text ID', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <TypedTabs
        disabledKeys={[1]}
        onSelectionChange={onSelectionChange}
        defaultSelectedKey="ab"
      />,
    );
    await user.click(screen.getByRole('tab', { name: 'Numeric' }));
    expect(onSelectionChange).not.toHaveBeenCalled();
    await user.click(screen.getByRole('tab', { name: 'Text' }));
    expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith('1');
  });

  it('UIC-TABS-2.8 UIC-TABS-3.1 UIC-TABS-3.4 reports raw IDs from remove, rename and reorder actions', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const onRename = vi.fn();
    const onReorder = vi.fn();
    const validateName = vi.fn();
    render(<TypedTabs list={{ onRemove, onRename, onReorder, validateName }} />);
    const numeric = screen.getByRole('tab', { name: 'Numeric' });
    await user.click(numeric);
    await user.keyboard('{Alt>}{ArrowRight}{/Alt}');
    expect(onReorder).toHaveBeenCalledExactlyOnceWith({
      key: 1,
      targetKey: '1',
      position: 'after',
    });
    await user.keyboard('{Delete}');
    expect(onRemove).toHaveBeenCalledExactlyOnceWith(new Set([1]));
    await user.keyboard('{F2}');
    const field = screen.getByRole('textbox', { name: 'Rename Numeric' });
    await user.clear(field);
    await user.type(field, 'Number');
    await user.keyboard('{Enter}');
    expect(validateName).toHaveBeenLastCalledWith(1, 'Number');
    expect(onRename).toHaveBeenCalledExactlyOnceWith(1, 'Number');
    await waitFor(() => expect(numeric).toHaveFocus());
  });

  it('UIC-COMPOSITION-4.2 UIC-TABS-1.1 pairs tabs rendered through a host component with their panels', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <Tabs defaultSelectedKey="b" disabledKeys={['c']} onSelectionChange={onSelectionChange}>
        <TabsList aria-label="Wrapped tabs">
          <NamedTab id="a">Apple</NamedTab>
          <NamedTab id="b">Banana</NamedTab>
          <NamedTab id="c">Cherry</NamedTab>
        </TabsList>
        <TabsContent id="a">Apple panel</TabsContent>
        <TabsContent id="b">Banana panel</TabsContent>
        <TabsContent id="c">Cherry panel</TabsContent>
      </Tabs>,
    );
    const banana = screen.getByRole('tab', { name: 'Banana' });
    expect(banana).toHaveAttribute('aria-selected', 'true');
    expect(banana).toHaveAttribute('aria-controls', screen.getByRole('tabpanel').id);
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Banana panel');
    expect(screen.getByRole('tab', { name: 'Cherry' })).toHaveAttribute('aria-disabled', 'true');
    await user.click(screen.getByRole('tab', { name: 'Apple' }));
    expect(onSelectionChange).toHaveBeenLastCalledWith('a');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Apple panel');
  });

  it('UIC-COMPOSITION-4.2 UIC-TABS-2.8 UIC-TABS-3.1 reports the ids of tabs rendered through a host component', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const onRename = vi.fn();
    render(
      <Tabs>
        <TabsList aria-label="Wrapped tabs" onRemove={onRemove} onRename={onRename}>
          <NamedTab id={1}>Numeric</NamedTab>
          <NamedTab id="1">Text</NamedTab>
        </TabsList>
      </Tabs>,
    );
    const text = screen.getByRole('tab', { name: 'Text' });
    await user.click(text);
    await user.keyboard('{Delete}');
    expect(onRemove).toHaveBeenLastCalledWith(new Set(['1']));
    await user.keyboard('{F2}');
    const field = screen.getByRole('textbox', { name: 'Rename Text' });
    await user.clear(field);
    await user.type(field, 'Words{Enter}');
    expect(onRename).toHaveBeenLastCalledWith('1', 'Words');
  });
});
