import { jsx as _jsx } from "react/jsx-runtime";
import { useLocale } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { capitalizeText, describeRelativeTime, } from '../../utils/relative-time.js';
import { useClockTick } from './relative-time-clock.js';
import { TimeWithTooltip } from './relative-time-tooltip.js';
const hooks = createHooks('relative-time', ['tooltip']);
const currentTime = () => new Date();
/**
 * A timestamp read relative to now (`5 minutes ago`, `Yesterday`) in a `<time>` element, which
 * updates on one clock shared by every timestamp on the page and shows the absolute date in a
 * tooltip. Past `fallbackAfterDays` it reads as the absolute date.
 */
export function RelativeTime({ value, fallbackAfterDays = 7, dateStyle, timeStyle, getNow = currentTime, showTooltip = true, capitalize = true, placeholder, className, ...rest }) {
    const { locale } = useLocale();
    const options = { now: getNow(), locale, fallbackAfterDays, dateStyle, timeStyle };
    const text = value ? describeRelativeTime(value, options) : null;
    useClockTick(text?.nextChange ?? null);
    const finish = (words) => (capitalize ? capitalizeText(words, locale) : words);
    if (!text || !value) {
        if (!placeholder)
            return null;
        return (_jsx("span", { ...rest, ...hooks.root({ className, data: { empty: true } }), children: finish(placeholder) }));
    }
    const data = { relation: text.relation, format: text.isRelative ? 'relative' : 'absolute' };
    const timeProps = { ...rest, ...hooks.root({ className, data }), dateTime: value };
    const words = text.isRelative ? finish(text.relative) : text.relative;
    // A timestamp already read as the absolute date has nothing to add in a tooltip.
    if (!showTooltip || !text.isRelative)
        return _jsx("time", { ...timeProps, children: words });
    return (_jsx(TimeWithTooltip, { ...timeProps, tooltip: text.absolute, tooltipClassName: hooks.slotClass('tooltip'), children: words }));
}
//# sourceMappingURL=relative-time.js.map