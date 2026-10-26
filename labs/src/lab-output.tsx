// A named readout of a lab's last value or event, which the browser tests read by its name.

import type { ReactNode } from 'react';

export function LabOutput({ name, children }: { name: string; children: ReactNode }) {
  return (
    <p>
      {name}: <output data-lab-output={name}>{children}</output>
    </p>
  );
}
