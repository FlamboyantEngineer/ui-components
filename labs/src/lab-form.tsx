// Shared lab helpers: a native form that shows what it submits, and a mount-on-demand switch.

import { type FormEvent, type ReactNode, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { LabOutput } from './lab-output.js';

/** The form's entries as `name=value`, in order, or `nothing` for an empty submission. */
function describeEntries(form: HTMLFormElement): string {
  const entries = [...new FormData(form)].map(
    ([name, value]) => `${name}=${typeof value === 'string' ? value : value.name}`,
  );
  return entries.join(', ') || 'nothing';
}

/**
 * A native form with Submit and Reset. A submission the browser lets through shows its entries
 * under `Submitted` (the browser itself blocks a native constraint it finds unmet).
 */
export function LabForm({
  label,
  children,
  noValidate = false,
}: {
  label: string;
  children: ReactNode;
  /** Skips the browser's constraint check, as a form with `aria` validation does. */
  noValidate?: boolean;
}) {
  const [submitted, setSubmitted] = useState('not yet');
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(describeEntries(event.currentTarget));
  };
  return (
    <form aria-label={label} noValidate={noValidate} onSubmit={submit} data-lab-form={label}>
      {children}
      <Button type="submit" variant="primary">
        Submit
      </Button>
      <Button type="reset">Reset</Button>
      <LabOutput name={`${label} submitted`}>{submitted}</LabOutput>
    </form>
  );
}

/** Mounts its content on demand, so a control's `autoFocus` can be seen taking focus as it mounts. */
export function MountOnDemand({ label, children }: { label: string; children: ReactNode }) {
  const [isMounted, setMounted] = useState(false);
  return (
    <>
      <Button onPress={() => setMounted((current) => !current)}>
        {isMounted ? `Remove ${label}` : `Mount ${label}`}
      </Button>
      {isMounted ? children : null}
    </>
  );
}
