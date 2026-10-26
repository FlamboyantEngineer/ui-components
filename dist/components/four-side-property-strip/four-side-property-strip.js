import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useControllableState } from '../../core/controllable-state.js';
import { createHooks, dataAttributes, mergeClassNames } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { PropertyRow, PropertyStrip, PropertyStripCell, } from '../property-panel/property-panel.js';
const physicalSides = ['top', 'bottom', 'left', 'right'];
const logicalSides = [
    'block-start',
    'block-end',
    'inline-start',
    'inline-end',
];
const hooks = createHooks('four-side-property-strip', ['side', 'link']);
/** The side across the box from `index`: sides come in opposite pairs, in order. */
function opposite(sides, index) {
    return sides[index % 2 === 0 ? index + 1 : index - 1];
}
/** The values after `side` takes `value`, with the sides linked to it. */
function setSide(values, { sides, side, value }, link) {
    const index = sides.indexOf(side);
    const pair = opposite(sides, index);
    const linked = link === 'all' ? sides : link === 'pairs' && pair ? [side, pair] : [side];
    const next = { ...values };
    for (const each of linked)
        next[each] = value;
    return next;
}
/**
 * One property row holding a value for each side of a box, such as margins or padding: top,
 * bottom, left and right, or their flow-relative counterparts. Each side's cell shows the first
 * letter of the side's name; the names are also words a query matches. Holding the values, the
 * strip can link its sides so that one edit sets all four or each opposite pair.
 */
export function FourSidePropertyStrip(props) {
    const { sides: mode, renderSide, value, defaultValue, onChange, className, ...row } = props;
    const { link, isLinked, defaultLinked, onLinkedChange, ...rest } = row;
    const strings = useUiStrings();
    const [values, setValues] = useControllableState(value, defaultValue ?? {}, onChange);
    const [linked, setLinked] = useControllableState(isLinked, defaultLinked ?? false, onLinkedChange);
    const sides = mode === 'logical' ? logicalSides : physicalSides;
    const nameOf = (side) => mode === 'logical'
        ? strings.logicalBoxSide(side)
        : strings.boxSide(side);
    const draw = renderSide;
    const activeLink = link && linked ? link : null;
    return (_jsx(PropertyRow, { ...rest, ...dataAttributes({ linked: activeLink !== null }), className: mergeClassNames(hooks.className, className), keywords: sides.map(nameOf), children: _jsxs(PropertyStrip, { children: [sides.map((side) => {
                    const name = nameOf(side);
                    const field = {
                        value: values[side],
                        onChange: (next) => setValues(setSide(values, { sides, side, value: next }, activeLink)),
                    };
                    return (_jsx(PropertyStripCell, { ...hooks.slot('side', { side }), letter: Array.from(name)[0] ?? '', label: name, children: draw(side, field) }, side));
                }), link ? (_jsx(Button, { className: hooks.slotClass('link'), icon: "link", size: "sm", label: strings.linkSides(link), isSelected: linked, onChange: setLinked })) : null] }) }));
}
//# sourceMappingURL=four-side-property-strip.js.map