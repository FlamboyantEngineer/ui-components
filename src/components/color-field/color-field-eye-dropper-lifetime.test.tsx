import { act, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ColorField } from './color-field.js';

interface Sample {
  signal: AbortSignal | undefined;
  resolve: (hex: string) => void;
}

/** An eye dropper whose samples the test resolves, one per `open()`. */
function stubDeferredEyeDropper() {
  const samples: Sample[] = [];
  vi.stubGlobal(
    'EyeDropper',
    vi.fn(function eyeDropper() {
      return {
        open: (options?: { signal?: AbortSignal }) =>
          new Promise<{ sRGBHex: string }>((resolve) => {
            samples.push({ signal: options?.signal, resolve: (hex) => resolve({ sRGBHex: hex }) });
          }),
      };
    }),
  );
  return samples;
}

async function sampleFromPicker(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /^Accent/ }));
  const dialog = await screen.findByRole('dialog');
  await user.click(within(dialog).getByRole('button', { name: 'Pick a color from the screen' }));
}

function nth(samples: Sample[], index: number): Sample {
  const sample = samples[index];
  if (!sample) throw new Error(`No sample ${index}`);
  return sample;
}

describe('ColorField eye dropper samples that outlive their picker', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('UIC-COLOR-FIELD-4.2 aborts and ignores a sample once the field unmounts', async () => {
    const user = userEvent.setup();
    const samples = stubDeferredEyeDropper();
    const onChange = vi.fn();
    const { unmount } = render(
      <ColorField label="Accent" defaultValue="#336699" allowsEyeDropper onChange={onChange} />,
    );
    await sampleFromPicker(user);
    unmount();
    expect(nth(samples, 0).signal?.aborted).toBe(true);
    await act(async () => nth(samples, 0).resolve('#ff8800'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('UIC-COLOR-FIELD-4.2 ignores a sample once its picker closes, also after it reopens', async () => {
    const user = userEvent.setup();
    const samples = stubDeferredEyeDropper();
    const onChange = vi.fn();
    render(
      <ColorField label="Accent" defaultValue="#336699" allowsEyeDropper onChange={onChange} />,
    );
    await sampleFromPicker(user);
    await user.keyboard('{Escape}');
    expect(nth(samples, 0).signal?.aborted).toBe(true);
    await sampleFromPicker(user);
    await act(async () => nth(samples, 0).resolve('#ff8800'));
    expect(onChange).not.toHaveBeenCalled();
    expect(nth(samples, 1).signal?.aborted).toBe(false);
    await act(async () => nth(samples, 1).resolve('#008844'));
    expect(onChange).toHaveBeenLastCalledWith('#008844');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('UIC-COLOR-FIELD-4.2 lets a newer sample in the same picker replace an older one', async () => {
    const user = userEvent.setup();
    const samples = stubDeferredEyeDropper();
    const onChange = vi.fn();
    render(
      <ColorField label="Accent" defaultValue="#336699" allowsEyeDropper onChange={onChange} />,
    );
    await sampleFromPicker(user);
    await user.click(screen.getByRole('button', { name: 'Pick a color from the screen' }));
    expect(nth(samples, 0).signal?.aborted).toBe(true);
    await act(async () => nth(samples, 1).resolve('#008844'));
    await act(async () => nth(samples, 0).resolve('#ff8800'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith('#008844');
  });
});
