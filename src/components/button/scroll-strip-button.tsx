'use client';

import { ChevronLeftGlyph, ChevronRightGlyph } from '../../core/glyphs.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useLocale } from '../../primitives/index.js';
import { Button } from './button.js';

interface ScrollStripButtonProps extends BaseProps {
  edge: 'start' | 'end';
  isHidden: boolean;
  onPress: (edge: 'start' | 'end') => void;
}

/**
 * An edge scroll command, with direction and wording shared by tabs and tool strips: a ghost icon
 * button, so the strip's fade, not a boxed button, marks the edge.
 */
export function ScrollStripButton({ edge, isHidden, onPress, ...rest }: ScrollStripButtonProps) {
  const strings = useUiStrings();
  const pointsLeft = (edge === 'start') !== (useLocale().direction === 'rtl');
  return (
    <Button
      {...rest}
      icon={pointsLeft ? ChevronLeftGlyph : ChevronRightGlyph}
      label={edge === 'start' ? strings.scrollBackward : strings.scrollForward}
      variant="ghost"
      size="sm"
      excludeFromTabOrder
      hidden={isHidden}
      onPress={() => onPress(edge)}
    />
  );
}
