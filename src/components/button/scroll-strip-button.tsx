import { useLocale } from '../../primitives/index.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from './button.js';

interface ScrollStripButtonProps extends BaseProps {
  edge: 'start' | 'end';
  isHidden: boolean;
  onPress: (edge: 'start' | 'end') => void;
}

/** An edge scroll command, with direction and wording shared by tabs and tool strips. */
export function ScrollStripButton({ edge, isHidden, onPress, ...rest }: ScrollStripButtonProps) {
  const strings = useUiStrings();
  const pointsLeft = (edge === 'start') !== (useLocale().direction === 'rtl');
  return (
    <Button
      {...rest}
      icon={pointsLeft ? 'chevron-left' : 'chevron-right'}
      label={edge === 'start' ? strings.scrollBackward : strings.scrollForward}
      size="sm"
      excludeFromTabOrder
      hidden={isHidden}
      onPress={() => onPress(edge)}
    />
  );
}
