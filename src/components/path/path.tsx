import { createHooks } from '../../core/hooks.js';
import { formatPath } from '../../utils/path.js';
import {
  TruncationTooltip,
  type TruncationTooltipProps,
} from '../truncation-tooltip/truncation-tooltip.js';

/** The truncation tooltip's expandable text, which a path does not offer. */
type TooltipExpansionProps = 'expandable' | 'isExpanded' | 'defaultExpanded' | 'onExpandedChange';

export interface PathProps extends Omit<
  TruncationTooltipProps,
  'children' | 'placement' | 'delay' | TooltipExpansionProps
> {
  /** A `/`-separated string (rooted when it starts with `/`) or a list of labels kept whole. */
  path: string | readonly string[];
  /**
   * @deprecated A path adds no control; this draws the tooltip's "Show more" button and a later
   * major release removes it.
   */
  expandable?: boolean | undefined;
  /** @deprecated See `expandable`. */
  isExpanded?: boolean | undefined;
  /** @deprecated See `expandable`. */
  defaultExpanded?: boolean | undefined;
  /** @deprecated See `expandable`. */
  onExpandedChange?: ((isExpanded: boolean) => void) | undefined;
}

const hooks = createHooks('path', ['text']);

/**
 * One line of location text that a stylesheet truncates from the start, keeping the end visible,
 * and that shows the whole path in a tooltip while it is cut.
 */
export function Path({ path, className, ...rest }: PathProps) {
  const text =
    typeof path === 'string'
      ? formatPath(path, { rooted: path.trimStart().startsWith('/') })
      : formatPath(path);
  return (
    <TruncationTooltip {...rest} {...hooks.root({ className, props: rest })}>
      <bdi {...hooks.slot('text')} dir="ltr">
        {text}
      </bdi>
    </TruncationTooltip>
  );
}
