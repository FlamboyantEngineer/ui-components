import { act, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { UiProvider } from '../../core/provider.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Button } from '../button/button.js';
import { Modal, ModalTrigger } from '../modal/modal.js';
import { HeadingLevelContext } from '../section-header/section-header.js';
import { TextField } from '../text-field/text-field.js';
import { Wizard, type WizardProps, type WizardStep } from './wizard.js';

/** A trip planner: a required city, an optional note, then a summary. */
function tripSteps(overrides: Partial<Record<string, Partial<WizardStep>>> = {}): WizardStep[] {
  return [
    {
      id: 'city',
      label: 'City',
      description: 'Where to',
      content: <TextField label="City name" name="city" isRequired />,
      ...overrides.city,
    },
    {
      id: 'note',
      label: 'Note',
      isOptional: true,
      content: <TextField label="Note text" name="note" />,
      ...overrides.note,
    },
    { id: 'summary', label: 'Summary', content: <p>All set.</p>, ...overrides.summary },
  ];
}

function renderWizard(props: Partial<WizardProps> = {}) {
  return render(<Wizard aria-label="Plan a trip" steps={tripSteps()} {...props} />);
}

const action = (name: string) => screen.getByRole('button', { name });
const heading = () => document.querySelector('.ui-wizard__heading') as HTMLElement;
const statuses = () =>
  within(screen.getByRole('list', { name: 'Steps' }))
    .getAllByRole('listitem')
    .map((row) => row.getAttribute('data-status'));

/** Fills the required city and goes to the note step. */
async function passCity() {
  await userEvent.type(screen.getByRole('textbox', { name: 'City name' }), 'Lisbon');
  await userEvent.click(action('Next'));
}

describe('Wizard', () => {
  it('UIC-WIZARD-2.1 keeps numeric and text step IDs separate when replacing an uncontrolled field', async () => {
    const user = userEvent.setup();
    const onCurrentIdChange = vi.fn();
    render(
      <Wizard
        onCurrentIdChange={onCurrentIdChange}
        steps={[
          { id: 1, label: 'First', content: <TextField label="Draft" defaultValue="First" /> },
          { id: '1', label: 'Second', content: <TextField label="Draft" defaultValue="Second" /> },
        ]}
      />,
    );
    await user.type(screen.getByRole('textbox', { name: 'Draft' }), ' edited');
    await user.click(action('Next'));
    expect(onCurrentIdChange).toHaveBeenCalledWith('1');
    expect(screen.getByRole('textbox', { name: 'Draft' })).toHaveValue('Second');
    await user.click(action('Back'));
    expect(onCurrentIdChange).toHaveBeenLastCalledWith(1);
    expect(screen.getByRole('textbox', { name: 'Draft' })).toHaveValue('First');
  });

  it('UIC-WIZARD-1.1 renders the steps, the current panel in a form, and the footer', () => {
    const { container } = renderWizard();
    const root = screen.getByRole('group', { name: 'Plan a trip' });
    expect(root).toHaveClass('ui-wizard');
    const steps = within(root).getByRole('list', { name: 'Steps' });
    expect(steps).toHaveClass('ui-steps', 'ui-wizard__steps');
    expect(
      within(steps)
        .getAllByRole('listitem')
        .map((row) => row.textContent),
    ).toEqual(['1City Where to', '2Note Optional', '3Summary']);
    const form = container.querySelector('form');
    expect(form).toHaveClass('ui-form', 'ui-wizard__form');
    const panel = screen.getByRole('group', { name: 'City' });
    expect(panel).toHaveClass('ui-wizard__panel');
    expect(form).toContainElement(panel);
    expect(within(panel).getByRole('textbox', { name: 'City name' })).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Note text' })).not.toBeInTheDocument();
    expect(form?.querySelector('.ui-wizard__footer')).not.toBeNull();
    expectHooksMatchSpec(container, 'WIZARD', {
      slots: ['steps', 'form', 'panel', 'heading', 'footer', 'action'],
    });
  });

  it('UIC-WIZARD-1.2 sets the heading level', () => {
    const { rerender } = renderWizard();
    expect(screen.getByRole('heading', { name: 'City' }).tagName).toBe('H3');
    rerender(<Wizard steps={tripSteps()} headingLevel={2} />);
    expect(screen.getByRole('heading', { name: 'City' }).tagName).toBe('H2');
    rerender(
      <HeadingLevelContext value={4}>
        <Wizard steps={tripSteps()} />
      </HeadingLevelContext>,
    );
    expect(screen.getByRole('heading', { name: 'City' }).tagName).toBe('H5');
  });

  it('UIC-WIZARD-1.3 shows the buttons each step allows', async () => {
    const onCancel = vi.fn();
    const { container } = renderWizard({ onCancel, finishLabel: 'Book trip' });
    const names = () =>
      Array.from(container.querySelectorAll('.ui-wizard__action')).map((button) => [
        button.getAttribute('data-action'),
        button.textContent,
      ]);
    expect(names()).toEqual([
      ['cancel', 'Cancel'],
      ['next', 'Next'],
    ]);
    expect(action('Next')).toHaveAttribute('type', 'submit');
    await userEvent.click(action('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
    await passCity();
    expect(names()).toEqual([
      ['cancel', 'Cancel'],
      ['back', 'Back'],
      ['skip', 'Skip'],
      ['next', 'Next'],
    ]);
    await userEvent.click(action('Next'));
    expect(names()).toEqual([
      ['cancel', 'Cancel'],
      ['back', 'Back'],
      ['finish', 'Book trip'],
    ]);
    expectHooksMatchSpec(container, 'WIZARD');
  });

  it('UIC-WIZARD-1.3 reads its labels from the provider', () => {
    render(
      <UiProvider messages={{ finish: 'Done' }}>
        <Wizard steps={tripSteps().slice(2)} />
      </UiProvider>,
    );
    expect(action('Done')).toHaveAttribute('data-action', 'finish');
  });

  it('UIC-WIZARD-1.4 publishes the orientation on the root and the steps', () => {
    const { container, rerender } = renderWizard();
    const root = container.querySelector('.ui-wizard');
    expect(root).toHaveAttribute('data-orientation', 'horizontal');
    rerender(<Wizard steps={tripSteps()} orientation="vertical" />);
    expect(root).toHaveAttribute('data-orientation', 'vertical');
    expect(container.querySelector('.ui-steps')).toHaveAttribute('data-orientation', 'vertical');
  });

  it('UIC-WIZARD-1.5 forwards id, class names and caller attributes', () => {
    const { container } = render(
      <>
        <h2 id="title">Trip</h2>
        <Wizard
          steps={tripSteps()}
          id="trip"
          className="host"
          aria-labelledby="title"
          data-orientation="caller"
          data-test="wizard"
        />
      </>,
    );
    const root = screen.getByRole('group', { name: 'Trip' });
    expect(root).toHaveAttribute('id', 'trip');
    expect(root).toHaveClass('ui-wizard', 'host');
    expect(root).toHaveAttribute('data-test', 'wizard');
    expect(root).toHaveAttribute('data-orientation', 'horizontal');
    expectHooksMatchSpec(container, 'WIZARD', { callerAttributes: ['data-test'] });
  });

  it('UIC-WIZARD-2.1 follows a controlled step and reports every move', async () => {
    const onCurrentIdChange = vi.fn();
    const { rerender } = renderWizard({ currentId: 'note', onCurrentIdChange });
    expect(screen.getByRole('heading', { name: 'Note' })).toBeInTheDocument();
    expect(statuses()).toEqual(['complete', 'current', 'upcoming']);
    await userEvent.click(action('Next'));
    expect(onCurrentIdChange).toHaveBeenCalledWith('summary');
    expect(screen.getByRole('heading', { name: 'Note' })).toBeInTheDocument();
    rerender(
      <Wizard steps={tripSteps()} currentId="summary" onCurrentIdChange={onCurrentIdChange} />,
    );
    expect(statuses()).toEqual(['complete', 'complete', 'current']);
  });

  it('UIC-WIZARD-2.1 starts at the default step, uncontrolled', () => {
    renderWizard({ defaultCurrentId: 'summary' });
    expect(screen.getByRole('heading', { name: 'Summary' })).toBeInTheDocument();
  });

  it('UIC-WIZARD-2.2 checks the fields before moving on', async () => {
    const onCurrentIdChange = vi.fn();
    renderWizard({ onCurrentIdChange });
    await userEvent.click(action('Next'));
    const city = screen.getByRole('textbox', { name: 'City name' });
    expect(city).toHaveFocus();
    expect(city).toHaveAttribute('aria-invalid', 'true');
    expect(onCurrentIdChange).not.toHaveBeenCalled();
    await userEvent.type(city, 'Lisbon{Enter}');
    expect(onCurrentIdChange).toHaveBeenCalledWith('note');
    expect(screen.getByRole('heading', { name: 'Note' })).toBeInTheDocument();
  });

  it('UIC-WIZARD-2.2 UIC-WIZARD-2.3 stays on a step whose check fails, with its message', async () => {
    const validate = vi.fn<() => boolean | string>().mockReturnValueOnce(false);
    validate.mockReturnValueOnce('Pick a city we fly to.').mockReturnValue(true);
    const { container } = render(<Wizard steps={tripSteps({ city: { validate } })} />);
    await userEvent.type(screen.getByRole('textbox', { name: 'City name' }), 'Atlantis');
    await userEvent.click(action('Next'));
    expect(validate).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('heading', { name: 'City' })).toBeInTheDocument();
    expect(statuses()[0]).toBe('error');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await userEvent.click(action('Next'));
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Pick a city we fly to.');
    expect(alert).toHaveClass('ui-inline-error', 'ui-wizard__error');
    expectHooksMatchSpec(container, 'WIZARD', { slots: ['error'] });
    await userEvent.click(action('Next'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Note' })).toBeInTheDocument();
    expect(statuses()).toEqual(['complete', 'current', 'upcoming']);
  });

  it('UIC-WIZARD-2.2 keeps Next pending while an asynchronous check runs', async () => {
    let settle: (value: boolean) => void = () => {};
    const validate = () => new Promise<boolean>((resolve) => (settle = resolve));
    const onCurrentIdChange = vi.fn();
    const { container } = render(
      <Wizard
        steps={tripSteps({ note: { validate } })}
        defaultCurrentId="note"
        onCurrentIdChange={onCurrentIdChange}
      />,
    );
    await userEvent.click(action('Next'));
    expect(action('Next')).toHaveAttribute('data-pending', 'true');
    expect(container.querySelector('.ui-wizard')).toHaveAttribute('data-pending', 'true');
    expect(action('Back')).toBeDisabled();
    expect(action('Skip')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'City Completed Where to' })).toBeDisabled();
    expectHooksMatchSpec(container, 'WIZARD');
    await userEvent.click(action('Next'));
    await act(async () => settle(true));
    expect(onCurrentIdChange).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('heading', { name: 'Summary' })).toBeInTheDocument();
    expect(container.querySelector('.ui-wizard')).not.toHaveAttribute('data-pending');
  });

  it('UIC-WIZARD-2.2 finishes once the last step passes', async () => {
    let settle: () => void = () => {};
    const onFinish = vi.fn(() => new Promise<void>((resolve) => (settle = resolve)));
    renderWizard({ defaultCurrentId: 'summary', onFinish });
    await userEvent.click(action('Finish'));
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(action('Finish')).toHaveAttribute('data-pending', 'true');
    await act(async () => settle());
    expect(action('Finish')).not.toHaveAttribute('data-pending');
  });

  it('UIC-WIZARD-2.2 shows the message of a rejected finish or check', async () => {
    const onFinish = vi.fn().mockRejectedValueOnce(new Error('The booking failed.'));
    onFinish.mockRejectedValueOnce('no message');
    render(
      <UiProvider messages={{ actionFailed: 'Something went wrong.' }}>
        <Wizard steps={tripSteps()} defaultCurrentId="summary" onFinish={onFinish} />
      </UiProvider>,
    );
    await userEvent.click(action('Finish'));
    expect(await screen.findByRole('alert')).toHaveTextContent('The booking failed.');
    expect(statuses()[2]).toBe('error');
    await userEvent.click(action('Finish'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong.');
  });

  it('UIC-WIZARD-2.6 never finishes from a check the wizard left by unmounting', async () => {
    let settle: (value: boolean) => void = () => {};
    let signal: AbortSignal | undefined;
    const validate = (next: AbortSignal) => {
      signal = next;
      return new Promise<boolean>((resolve) => (settle = resolve));
    };
    const onFinish = vi.fn();
    const { unmount } = renderWizard({
      steps: tripSteps({ summary: { validate } }),
      defaultCurrentId: 'summary',
      onFinish,
    });
    await userEvent.click(action('Finish'));
    expect(signal?.aborted).toBe(false);
    unmount();
    expect(signal?.aborted).toBe(true);
    await act(async () => settle(true));
    expect(onFinish).not.toHaveBeenCalled();
  });

  it('UIC-WIZARD-2.6 drops a pending check once a controlled wizard shows another step', async () => {
    const checks: { settle: (value: boolean | string) => void; signal: AbortSignal }[] = [];
    const validate = (signal: AbortSignal) =>
      new Promise<boolean | string>((resolve) => checks.push({ settle: resolve, signal }));
    const onCurrentIdChange = vi.fn();
    const steps = tripSteps({ note: { validate } });
    const { rerender, container } = render(
      <Wizard steps={steps} currentId="note" onCurrentIdChange={onCurrentIdChange} />,
    );
    await userEvent.click(action('Next'));
    rerender(<Wizard steps={steps} currentId="city" onCurrentIdChange={onCurrentIdChange} />);
    expect(checks[0]?.signal.aborted).toBe(true);
    expect(container.querySelector('.ui-wizard')).not.toHaveAttribute('data-pending');
    expect(action('Next')).not.toHaveAttribute('data-pending');
    await act(async () => checks[0]?.settle(true));
    expect(onCurrentIdChange).not.toHaveBeenCalled();
    rerender(<Wizard steps={steps} currentId="note" onCurrentIdChange={onCurrentIdChange} />);
    await userEvent.click(action('Next'));
    expect(checks).toHaveLength(2);
    await act(async () => checks[1]?.settle(true));
    expect(onCurrentIdChange).toHaveBeenCalledWith('summary');
  });

  it('UIC-WIZARD-2.6 ignores a late refusal or error from a check whose workflow was replaced', async () => {
    let refuse: (error: Error) => void = () => {};
    const validate = () => new Promise<boolean>((_, reject) => (refuse = reject));
    const onFinish = vi.fn();
    const { rerender } = render(
      <Wizard
        steps={tripSteps({ summary: { validate } })}
        defaultCurrentId="summary"
        onFinish={onFinish}
      />,
    );
    await userEvent.click(action('Finish'));
    const replaced = [
      { id: 'review', label: 'Review', content: <p>Look it over.</p> },
      { id: 'summary', label: 'Summary', content: <p>All set.</p> },
    ];
    rerender(<Wizard steps={replaced} defaultCurrentId="summary" onFinish={onFinish} />);
    expect(action('Finish')).not.toHaveAttribute('data-pending');
    await act(async () => refuse(new Error('Too late.')));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(statuses()).toEqual(['complete', 'current']);
    await userEvent.click(action('Finish'));
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('UIC-WIZARD-2.6 lets a started finish run while ignoring its outcome after the wizard leaves it', async () => {
    let fail: (error: Error) => void = () => {};
    const onFinish = vi.fn(() => new Promise<void>((_, reject) => (fail = reject)));
    const { unmount } = renderWizard({ defaultCurrentId: 'summary', onFinish });
    await userEvent.click(action('Finish'));
    expect(onFinish).toHaveBeenCalledTimes(1);
    unmount();
    await act(async () => fail(new Error('The booking failed.')));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('UIC-WIZARD-2.6 finishes a passed check through the workflow it checked, not a replacement', async () => {
    let settleA: (value: boolean) => void = () => {};
    const validateA = () => new Promise<boolean>((resolve) => (settleA = resolve));
    const validateB = vi.fn(() => false);
    const onFinishA = vi.fn();
    const onFinishB = vi.fn();
    const record = (validate: WizardStep['validate'], text: string): WizardStep[] => [
      { id: 'confirm', label: 'Confirm', content: <p>{text}</p>, validate },
    ];
    const { rerender } = render(
      <Wizard steps={record(validateA, 'Record A')} onFinish={onFinishA} />,
    );
    await userEvent.click(action('Finish'));
    rerender(<Wizard steps={record(validateB, 'Record B')} onFinish={onFinishB} />);
    await act(async () => settleA(true));
    expect(onFinishB).not.toHaveBeenCalled();
    expect(validateB).not.toHaveBeenCalled();
    expect(onFinishA).toHaveBeenCalledTimes(1);
  });

  it('UIC-WIZARD-2.6 aborts a check once a keyed wizard moves to another record', async () => {
    const checks: {
      settle: (value: boolean) => void;
      fail: (error: Error) => void;
      signal: AbortSignal;
    }[] = [];
    const validate = (signal: AbortSignal) =>
      new Promise<boolean>((settle, fail) => checks.push({ settle, fail, signal }));
    const onFinish = vi.fn();
    const record = (id: string) => (
      <Wizard
        key={id}
        steps={[{ id: 'confirm', label: 'Confirm', content: <p>{id}</p>, validate }]}
        onFinish={() => onFinish(id)}
      />
    );
    const { rerender } = render(record('A'));
    await userEvent.click(action('Finish'));
    rerender(record('B'));
    expect(checks[0]?.signal.aborted).toBe(true);
    expect(action('Finish')).not.toHaveAttribute('data-pending');
    await act(async () => checks[0]?.settle(true));
    expect(onFinish).not.toHaveBeenCalled();
    await userEvent.click(action('Finish'));
    rerender(record('C'));
    await act(async () => checks[1]?.fail(new Error('Too late.')));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await userEvent.click(action('Finish'));
    await act(async () => checks[2]?.settle(true));
    expect(onFinish).toHaveBeenCalledExactlyOnceWith('C');
  });

  it('UIC-WIZARD-2.6 keeps a check running through ordinary rerenders with new steps and callbacks', async () => {
    let settle: (value: boolean) => void = () => {};
    const validate = () => new Promise<boolean>((resolve) => (settle = resolve));
    const finishes: number[] = [];
    const view = (round: number) => (
      <Wizard
        steps={tripSteps({ summary: { validate } })}
        defaultCurrentId="summary"
        onFinish={() => void finishes.push(round)}
      />
    );
    const { rerender } = render(view(1));
    await userEvent.click(action('Finish'));
    rerender(view(2));
    expect(action('Finish')).toHaveAttribute('data-pending', 'true');
    await act(async () => settle(true));
    expect(finishes).toEqual([1]);
  });

  it('UIC-WIZARD-2.4 goes back without checking, and returns through the list of steps', async () => {
    const validate = vi.fn(() => true);
    render(<Wizard steps={tripSteps({ note: { validate } })} />);
    await passCity();
    await userEvent.click(action('Back'));
    expect(screen.getByRole('heading', { name: 'City' })).toBeInTheDocument();
    expect(validate).not.toHaveBeenCalled();
    expect(statuses()).toEqual(['current', 'upcoming', 'upcoming']);
    await passCity();
    await userEvent.click(action('Next'));
    expect(validate).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: 'City Completed Where to' }));
    expect(screen.getByRole('heading', { name: 'City' })).toBeInTheDocument();
    expect(validate).toHaveBeenCalledTimes(1);
  });

  it('UIC-WIZARD-2.5 skips an optional step and marks it skipped until it passes', async () => {
    const validate = vi.fn(() => true);
    render(<Wizard steps={tripSteps({ note: { validate } })} />);
    await passCity();
    await userEvent.click(action('Skip'));
    expect(validate).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Summary' })).toBeInTheDocument();
    expect(statuses()).toEqual(['complete', 'skipped', 'current']);
    await userEvent.click(screen.getByRole('button', { name: 'Note Skipped Optional' }));
    await userEvent.click(action('Next'));
    expect(statuses()).toEqual(['complete', 'complete', 'current']);
  });

  it('UIC-WIZARD-3.1 moves focus to the new heading after each move, not on the first render', async () => {
    renderWizard();
    expect(document.body).toHaveFocus();
    expect(heading()).toHaveAttribute('tabindex', '-1');
    await passCity();
    expect(screen.getByRole('heading', { name: 'Note' })).toHaveFocus();
    await userEvent.click(action('Skip'));
    expect(screen.getByRole('heading', { name: 'Summary' })).toHaveFocus();
    await userEvent.click(action('Back'));
    expect(screen.getByRole('heading', { name: 'Note' })).toHaveFocus();
    await userEvent.click(screen.getByRole('button', { name: 'City Completed Where to' }));
    expect(screen.getByRole('heading', { name: 'City' })).toHaveFocus();
  });

  it('UIC-WIZARD-3.2 works as the body of a modal', async () => {
    function TripModal() {
      const [finished, setFinished] = useState(false);
      return (
        <>
          <ModalTrigger>
            <Button>Plan a trip</Button>
            <Modal title="Plan a trip">
              {({ close }) => (
                <Wizard
                  steps={tripSteps()}
                  onCancel={close}
                  onFinish={() => {
                    setFinished(true);
                    close();
                  }}
                />
              )}
            </Modal>
          </ModalTrigger>
          {finished ? <p>Trip booked</p> : null}
        </>
      );
    }
    render(<TripModal />);
    await userEvent.click(action('Plan a trip'));
    const dialog = screen.getByRole('dialog', { name: 'Plan a trip' });
    expect(
      within(dialog)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['Cancel', 'Next']);
    await passCity();
    expect(within(dialog).getByRole('heading', { name: 'Note' })).toHaveFocus();
    await userEvent.click(action('Cancel'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await userEvent.click(action('Plan a trip'));
    await passCity();
    await userEvent.click(action('Next'));
    await userEvent.click(action('Finish'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Trip booked')).toBeInTheDocument();
  });
});
