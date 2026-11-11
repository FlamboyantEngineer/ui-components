import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMemoryStorage } from '../core/storage.js';
import { bootLabSettings, LabBar, type LabSettings, mountLabBar } from './index.js';

const settings: LabSettings = {
  stylesheet: { kind: 'reference' },
  theme: 'system',
  themeAttribute: 'data-theme',
};

afterEach(() => {
  document.getElementById('ui-lab-stylesheet')?.remove();
  const root = document.documentElement;
  for (const name of ['data-theme', 'data-lab-theme-attribute', 'data-lab-scheme']) {
    root.removeAttribute(name);
  }
  history.replaceState(null, '', '/');
});

describe('LabBar', () => {
  it('UIC-LABS-2.2 UIC-LABS-4.1 switches the theme with a segmented choice of icons', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const ref = createRef<HTMLDivElement>();
    render(
      <LabBar
        ref={ref}
        title="Button"
        defaultSettings={settings}
        indexHref="index.html"
        onChange={onChange}
      />,
    );
    const theme = screen.getByRole('radiogroup', { name: 'Theme' });
    expect(ref.current).toContainElement(theme);
    const names = within(theme)
      .getAllByRole('radio')
      .map((radio) => radio.textContent);
    expect(names).toEqual(['System', 'Light', 'Dark', 'Custom']);
    expect(theme.querySelectorAll('.ui-segmented-choice__icon')).toHaveLength(4);
    expect(within(theme).getByRole('radio', { name: 'System' })).toBeChecked();

    await user.click(within(theme).getByRole('radio', { name: 'Dark' }));
    expect(onChange).toHaveBeenLastCalledWith({ ...settings, theme: 'dark' });

    await user.click(within(theme).getByRole('radio', { name: 'Custom' }));
    expect(onChange).toHaveBeenLastCalledWith({ ...settings, theme: '' });
    await user.type(screen.getByRole('textbox', { name: 'Theme value' }), 'night');
    expect(onChange).toHaveBeenLastCalledWith({ ...settings, theme: 'night' });
  });

  it('UIC-LABS-4.1 links back to the index with the current settings, or hides the link', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <LabBar
        title="Button"
        defaultSettings={settings}
        indexHref="index.html"
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Button')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'All labs' });
    expect(link).toHaveAttribute('href', 'index.html');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Stylesheet' }), 'none');
    expect(link).toHaveAttribute('href', 'index.html?stylesheet=none');

    rerender(
      <LabBar title="Labs" defaultSettings={settings} indexHref={null} onChange={vi.fn()} />,
    );
    expect(screen.queryByRole('link', { name: 'All labs' })).not.toBeInTheDocument();
  });

  it('UIC-LABS-2.1 applies a custom stylesheet URL', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <LabBar title="Button" defaultSettings={settings} indexHref={null} onChange={onChange} />,
    );
    await user.selectOptions(screen.getByRole('combobox', { name: 'Stylesheet' }), 'custom');
    await user.type(screen.getByRole('textbox', { name: 'Stylesheet URL' }), '/host.css');
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onChange).toHaveBeenLastCalledWith({
      ...settings,
      stylesheet: { kind: 'custom', url: '/host.css' },
    });
  });
});

describe('mountLabBar', () => {
  it('UIC-LABS-2.3 UIC-LABS-2.4 UIC-LABS-4.2 renders in a shadow root and reports every change', async () => {
    const user = userEvent.setup();
    history.replaceState(null, '', '/button.html?theme=light&case=2');
    const host = document.createElement('header');
    document.body.append(host);
    const storage = createMemoryStorage();
    const onSettingsChange = vi.fn();

    const initial = mountLabBar({
      host,
      title: 'Button',
      indexHref: 'index.html',
      storage,
      referenceStylesheet: 'styles/reference.css',
      onSettingsChange,
    });
    expect(initial.theme).toBe('light');
    expect(onSettingsChange).toHaveBeenLastCalledWith(initial, '?theme=light');
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    expect(document.getElementById('ui-lab-stylesheet')).toHaveAttribute(
      'href',
      'styles/reference.css',
    );
    expect(host).toHaveAttribute('aria-label', 'Lab settings');

    const shadow = host.shadowRoot;
    if (!shadow) throw new Error('The lab bar renders in a shadow root');
    const dark = await within(shadow as unknown as HTMLElement).findByRole('radio', {
      name: 'Dark',
    });
    expect(screen.queryByRole('radio', { name: 'Dark' })).not.toBeInTheDocument();
    await user.click(dark);
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(location.search).toBe('?theme=dark&case=2');
    expect(storage.getItem('ui-labs:theme')).toBe('dark');
    expect(onSettingsChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ theme: 'dark' }),
      '?theme=dark',
    );
    host.remove();
  });
});

describe('bootLabSettings', () => {
  it('UIC-LABS-2.5 UIC-LABS-4.2 applies the query string, then the remembered choice', () => {
    history.replaceState(null, '', '/button.html');
    const storage = createMemoryStorage({ 'ui-labs:theme': 'dark' });
    expect(bootLabSettings({ storage })).toMatchObject({ theme: 'dark' });
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(document.getElementById('ui-lab-stylesheet')).toHaveAttribute(
      'href',
      'build/reference.css',
    );
  });
});
