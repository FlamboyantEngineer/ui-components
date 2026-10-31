// A host-side snippet of a component's exported helpers: each call as a host would write it, and
// what it returned in this browser. The browser tests read a result by its call.

import type { ReactNode } from 'react';

export function LabHelperCalls({ calls }: { calls: ReadonlyArray<readonly [string, ReactNode]> }) {
  return (
    <dl
      data-lab-helpers
      style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 16px' }}
    >
      {calls.map(([call, result]) => (
        <div key={call} style={{ display: 'contents' }}>
          <dt>
            <code>{call}</code>
          </dt>
          <dd style={{ margin: 0 }}>
            <span data-lab-call={call}>{result}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
