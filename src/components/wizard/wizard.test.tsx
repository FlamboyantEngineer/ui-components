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
    expect(screen.queryByRole('textbox', { name: 'Note text' })).toBeNull();
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
      <UiProvider strings={{ finish: 'Done' }}>
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
    expect(screen.queryByRole('alert')).toBeNull();
    await userEvent.click(action('Next'));
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Pick a city we fly to.');
    expect(alert).toHaveClass('ui-inline-error', 'ui-wizard__error');
    expectHooksMatchSpec(container, 'WIZARD', { slots: ['error'] });
    await userEvent.click(action('Next'));
    expect(screen.queryByRole('alert')).toBeNull();
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
      <UiProvider strings={{ actionFailed: 'Something went wrong.' }}>
        <Wizard steps={tripSteps()} defaultCurrentId="summary" onFinish={onFinish} />
      </UiProvider>,
    );
    await userEvent.click(action('Finish'));
    expect(await screen.findByRole('alert')).toHaveTextContent('The booking failed.');
    expect(statuses()[2]).toBe('error');
    await userEvent.click(action('Finish'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong.');
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
    expect(screen.queryByRole('dialog')).toBeNull();
    await userEvent.click(action('Plan a trip'));
    await passCity();
    await userEvent.click(action('Next'));
    await userEvent.click(action('Finish'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByText('Trip booked')).toBeInTheDocument();
  });
});
