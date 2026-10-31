import { createHooks } from '../../core/hooks.js';
import type { BaseProps, ContainerProps } from '../../core/props.js';

/** Width to height, landscape then portrait: `16-9` is sixteen wide by nine tall. */
export type AspectRatioValue = '1-1' | '4-3' | '3-2' | '16-9' | '21-9' | '3-4' | '2-3' | '9-16';

export interface AspectRatioProps extends ContainerProps<'div'>, BaseProps {
  /** Width to height of the box. Defaults to `1-1`. */
  ratio?: AspectRatioValue | undefined;
}

const hooks = createHooks('aspect-ratio');

/** A box whose height the stylesheet derives from its width, for media and embedded frames. */
export function AspectRatio({ ratio = '1-1', children, className, ...rest }: AspectRatioProps) {
  return (
    <div {...rest} {...hooks.root({ className, data: { ratio } })}>
      {children}
    </div>
  );
}
