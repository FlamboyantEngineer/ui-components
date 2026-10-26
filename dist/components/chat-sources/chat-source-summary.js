import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
// What a list item and a citation's card show of a source: its title (a link when it has a URL),
// its site and its snippet (specs/CHAT-SOURCES.md).
import { Link } from '../link/link.js';
const absoluteUrl = /^https?:/i;
/** The host of an absolute URL without its `www.`, or undefined for any other value. */
function readHost(url) {
    if (!url || !absoluteUrl.test(url))
        return undefined;
    try {
        return new URL(url).hostname.replace(/^www\./, '');
    }
    catch {
        return undefined;
    }
}
export function isExternalUrl(url) {
    return absoluteUrl.test(url);
}
export function ChatSourceSummary({ source, slotClass, }) {
    const site = source.siteName ?? readHost(source.url);
    return (_jsxs(_Fragment, { children: [source.url ? (_jsx(Link, { className: slotClass('title'), href: source.url, isExternal: isExternalUrl(source.url), children: source.title })) : (_jsx("span", { className: slotClass('title'), children: source.title })), site ? _jsx("span", { className: slotClass('site'), children: site }) : null, source.snippet ? _jsx("p", { className: slotClass('snippet'), children: source.snippet }) : null] }));
}
//# sourceMappingURL=chat-source-summary.js.map