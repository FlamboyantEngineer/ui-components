import { createHooks } from '../../core/hooks.js';
import { formatPath } from '../../utils/path.js';

export interface PathProps {
  /** A `/`-separated string (rooted when it starts with `/`) or a list of labels kept whole. */
  path: string | readonly string[];
  id?: string | undefined;
  hidden?: boolean | undefined;
  /** Announce path changes. Quiet by default. */
  live?: 'polite' | 'assertive' | undefined;
  className?: string | undefined;
  [data: `data-${string}`]: string | number | boolean | undefined;
}

const hooks = createHooks('path', ['text']);

/** One line of location text that a stylesheet truncates from the start, keeping the end visible. */
export function Path({ path, id, hidden, live, className, ...rest }: PathProps) {
  const text =
    typeof path === 'string'
      ? formatPath(path, { rooted: path.trimStart().startsWith('/') })
      : formatPath(path);
  return (
    <span {...hooks.root({ className, props: rest })} id={id} hidden={hidden} aria-live={live}>
      <bdi {...hooks.slot('text')} dir="ltr">
        {text}
      </bdi>
    </span>
  );
}
