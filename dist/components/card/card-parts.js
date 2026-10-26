import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
// The parts a custom card header composes: the title that names the card and the whole-card action.
import { createContext, useContext } from 'react';
import { mergeClassNames } from '../../core/hooks.js';
import { useHeadingLevel } from '../section-header/section-header.js';
import { CardActionTitle } from './card-action.js';
/** The parts of the card whose custom header is being drawn; `null` outside one. */
export const CardHeaderContext = createContext(null);
/**
 * The title of a card's custom header: a heading at the card's level with the card's title id and
 * hook class, which names the card. Outside a custom header it is a plain heading.
 */
export function CardTitle({ children, className, ...rest }) {
    const parts = useContext(CardHeaderContext);
    const automaticLevel = useHeadingLevel(undefined);
    const Heading = `h${parts?.title.level ?? automaticLevel}`;
    return (_jsx(Heading, { ...rest, id: parts?.title.id, ref: parts?.title.ref, className: mergeClassNames(parts?.title.className, className) || undefined, children: children }));
}
/**
 * The whole-card action in a card's custom header: the card's link (`href`) or button (`onAction`)
 * with the action hook class, which clicks anywhere on the card activate. Without a card action it
 * renders its children as they are.
 */
export function CardAction({ children, className, ...rest }) {
    const parts = useContext(CardHeaderContext);
    if (!parts?.action.isActionable)
        return _jsx(_Fragment, { children: children });
    const { action } = parts;
    return (_jsx(CardActionTitle, { ...rest, options: action.options, actionRef: action.ref, className: mergeClassNames(action.className, className), children: children }));
}
//# sourceMappingURL=card-parts.js.map