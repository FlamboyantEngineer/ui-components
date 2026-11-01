import { act, render } from '@testing-library/react';
import { useRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useNativeReset } from './use-native-reset.js';

function Control({ form, onReset }: { form?: string; onReset: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  useNativeReset(ref, onReset);
  return <input ref={ref} form={form} aria-label="Note" />;
}

const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 5)));

function resetForm(id: string, cancel = false) {
  const form = document.getElementById(id) as HTMLFormElement;
  const onReset = (event: Event) => {
    if (cancel) event.preventDefault();
  };
  form.addEventListener('reset', onReset, { once: true });
  act(() => form.reset());
}

describe('useNativeReset', () => {
  it('UIC-FIELD-2.6 resets with the form the control belongs to at each reset', async () => {
    const onReset = vi.fn();
    const view = (form: string) => (
      <>
        <form id="first" />
        <form id="second" />
        <Control form={form} onReset={onReset} />
      </>
    );
    const { rerender } = render(view('first'));
    rerender(view('second'));
    resetForm('first');
    await settle();
    expect(onReset).not.toHaveBeenCalled();
    resetForm('second');
    await settle();
    expect(onReset).toHaveBeenCalledTimes(1);
    resetForm('second', true);
    await settle();
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('UIC-FIELD-2.6 follows a form replaced under the id the control names', async () => {
    const onReset = vi.fn();
    const view = (key: string) => (
      <>
        <form key={key} id="owner" data-generation={key} />
        <Control form="owner" onReset={onReset} />
      </>
    );
    const { rerender, container } = render(view('a'));
    const replaced = container.querySelector('form');
    rerender(view('b'));
    expect(container.querySelector('form')).not.toBe(replaced);
    resetForm('owner');
    await settle();
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
