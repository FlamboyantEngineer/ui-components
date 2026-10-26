import { jsx as _jsx } from "react/jsx-runtime";
import { Button as AriaButton, Focusable } from '../../primitives/index.js';
import { toImageProps } from '../icon/icon.js';
import { UserCardTrigger } from '../user-card/user-card.js';
/** Interactive avatars use their root as the trigger, leaving the status dot outside the picture. */
export function AvatarRoot({ onPress, card, cardTrigger, imageLabel, isFocusable, children, ...rest }) {
    if (card)
        return (_jsx(UserCardTrigger, { ...rest, card: card, trigger: cardTrigger, onPress: onPress, children: children }));
    if (onPress)
        return (_jsx(AriaButton, { ...rest, onPress: onPress, children: children }));
    const image = (_jsx("span", { ...rest, ...toImageProps(imageLabel), children: children }));
    return isFocusable ? _jsx(Focusable, { children: image }) : image;
}
//# sourceMappingURL=avatar-root.js.map