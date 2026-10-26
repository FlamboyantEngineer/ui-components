import { type Ref } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import { type QrErrorCorrection } from '../../utils/encode-qr.js';
export interface QrCodeProps extends BaseProps, AriaLabellingProps {
    /** The text to encode, such as a URL. */
    value: string;
    /** How much damage the code survives: `low`, `medium` (the default), `quartile` or `high`. */
    errorCorrection?: QrErrorCorrection | undefined;
    /** The light margin around the symbol, in modules. Defaults to 4, the margin readers expect. */
    quietZone?: number | undefined;
    /** The drawn size of one module, in pixels. Defaults to 4. */
    moduleSize?: number | undefined;
    /** The `<svg>` element. */
    ref?: Ref<SVGSVGElement> | undefined;
}
/**
 * A QR code for `value`, drawn as an SVG image of its dark modules with a quiet zone around them.
 * The host stylesheet colours the modules and the ground; unstyled, they are black on the page.
 */
export declare function QrCode({ value, errorCorrection, quietZone, moduleSize, className, 'aria-label': ariaLabel, ...rest }: QrCodeProps): import("react").JSX.Element;
//# sourceMappingURL=qr-code.d.ts.map