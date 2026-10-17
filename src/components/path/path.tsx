import { createHooks } from '../../core/hooks.js';
import type { BaseProps, NativeProps } from '../../core/props.js';
import { formatPath } from '../../utils/path.js';

export interface PathProps extends Omit<NativeProps<'span'>, 'children'>, BaseProps {
  /** A `/`-separated string (rooted when it starts with `/`) or a list of labels kept whole. */
  path: string | readonly string[];
}

const hooks = createHooks('path', ['text']);

/** One line of location text that a stylesheet truncates from the start, keeping the end visible. */
export function Path({ path, className, ...rest }: PathProps) {
  const text =
    typeof path === 'string'
      ? formatPath(path, { rooted: path.trimStart().startsWith('/') })
      : formatPath(path);
  return (
    <span {...rest} {...hooks.root({ className, props: rest })}>
      <bdi {...hooks.slot('text')} dir="ltr">
        {text}
      </bdi>
    </span>
  );
}
