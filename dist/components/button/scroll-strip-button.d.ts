import type { BaseProps } from '../../core/props.js';
export interface ScrollStripButtonProps extends BaseProps {
    edge: 'start' | 'end';
    isHidden: boolean;
    onPress: (edge: 'start' | 'end') => void;
}
/** An edge scroll command, with direction and wording shared by tabs and tool strips. */
export declare function ScrollStripButton({ edge, isHidden, onPress, ...rest }: ScrollStripButtonProps): import("react").JSX.Element;
//# sourceMappingURL=scroll-strip-button.d.ts.map