import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from 'react';
import { useLocale } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { capitalizeText } from '../../utils/relative-time.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { Avatar, getDisplayName } from '../avatar/avatar.js';
import { EmptyState } from '../empty-state/empty-state.js';
import { Icon, toIconProps } from '../icon/icon.js';
import { LoadMore } from '../load-more/load-more.js';
import { RelativeTime } from '../relative-time/relative-time.js';
import { useHeadingLevel } from '../section-header/section-header.js';
import { groupByDay } from './day-groups.js';
const hooks = createHooks('activity-feed', [
    'filter',
    'list',
    'group',
    'day',
    'entries',
    'entry',
    'marker',
    'body',
    'summary',
    'actor',
    'action',
    'target',
    'time',
    'detail',
    'load-more',
]);
const currentTime = () => new Date();
/** The marker beside an entry: its glyph, else its person's avatar, else an empty dot. */
function EntryMarker({ item }) {
    let content = null;
    if (!isEmptyNode(item.icon))
        content = _jsx(Icon, { ...toIconProps(item.icon) });
    else if (item.person)
        content = _jsx(Avatar, { ...item.person, size: "sm", decorative: true });
    return (_jsx("span", { ...hooks.slot('marker'), "aria-hidden": "true", children: content }));
}
function Entry({ item, options }) {
    const strings = useUiStrings();
    return (_jsxs("li", { ...hooks.slot('entry'), children: [_jsx(EntryMarker, { item: item }), _jsxs("div", { ...hooks.slot('body'), children: [_jsxs("p", { ...hooks.slot('summary'), children: [item.person ? (_jsxs(_Fragment, { children: [_jsx("span", { ...hooks.slot('actor'), children: getDisplayName(item.person.name, strings.unnamed) }), ' '] })) : null, _jsx("span", { ...hooks.slot('action'), children: item.action }), isEmptyNode(item.target) ? null : (_jsxs(_Fragment, { children: [' ', _jsx("span", { ...hooks.slot('target'), children: item.target })] }))] }), _jsx(RelativeTime, { value: item.time, fallbackAfterDays: options.fallbackAfterDays, getNow: options.getNow, placeholder: strings.unknownTime, className: hooks.slotClass('time') }), isEmptyNode(item.detail) ? null : _jsx("div", { ...hooks.slot('detail'), children: item.detail })] })] }));
}
/** The entries under a heading per day. */
function DayGroups({ items, options, headingLevel, }) {
    const strings = useUiStrings();
    const { locale } = useLocale();
    const baseId = useId();
    const Heading = `h${useHeadingLevel(headingLevel)}`;
    const groups = groupByDay(items, {
        now: options.getNow(),
        locale,
        unknownLabel: capitalizeText(strings.unknownTime, locale),
    });
    return groups.map((group, index) => {
        const headingId = `${baseId}-${index}`;
        return (_jsxs("li", { ...hooks.slot('group'), children: [_jsx(Heading, { ...hooks.slot('day'), id: headingId, children: group.label }), _jsx("ol", { ...hooks.slot('entries'), "aria-labelledby": headingId, children: group.items.map((item) => (_jsx(Entry, { item: item, options: options }, toKeyIdentity(item.id)))) })] }, `${group.day}:${toKeyIdentity(group.items[0].id)}`));
    });
}
/** The entries' list, under day headings or not, named by the feed's labelling props. */
function FeedList({ items, groupBy, headingLevel, options, isLoading, labelling, }) {
    const strings = useUiStrings();
    const isNamed = labelling['aria-label'] !== undefined || labelling['aria-labelledby'] !== undefined;
    return (_jsx("ol", { ...labelling, "aria-label": isNamed ? labelling['aria-label'] : strings.activity, ...hooks.slot('list'), "aria-busy": isLoading || undefined, children: groupBy === 'day' ? (_jsx(DayGroups, { items: items, options: options, headingLevel: headingLevel })) : (items.map((item) => _jsx(Entry, { item: item, options: options }, toKeyIdentity(item.id)))) }));
}
/**
 * A chronological feed of events (who did what to what, and when, with optional detail), grouped
 * under a heading per day, with a filter slot, loading of older events as the end comes into view,
 * and an empty state.
 */
export function ActivityFeed({ items, groupBy = 'day', headingLevel, filter, onLoadMore, isLoading = false, renderEmptyState, fallbackAfterDays, getNow = currentTime, className, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy, 'aria-describedby': ariaDescribedBy, 'aria-details': ariaDetails, ...rest }) {
    const strings = useUiStrings();
    const isEmpty = items.length === 0;
    const labelling = {
        'aria-label': ariaLabel,
        'aria-labelledby': ariaLabelledBy,
        'aria-describedby': ariaDescribedBy,
        'aria-details': ariaDetails,
    };
    let content;
    if (isEmpty && isLoading) {
        content = _jsx(EmptyState, { variant: "loading", size: "sm", description: strings.loading });
    }
    else if (isEmpty) {
        content = renderEmptyState?.() ?? _jsx(EmptyState, { size: "sm", description: strings.noActivity });
    }
    else {
        content = (_jsx(FeedList, { items, groupBy, headingLevel, isLoading, labelling, options: { fallbackAfterDays, getNow } }));
    }
    return (_jsxs("div", { ...rest, ...hooks.root({ className, props: rest, data: { groupBy, loading: isLoading } }), children: [isEmptyNode(filter) ? null : _jsx("div", { ...hooks.slot('filter'), children: filter }), content, onLoadMore && !isEmpty ? (_jsx(LoadMore, { autoLoad: true, onLoadMore: onLoadMore, isPending: isLoading || undefined, className: hooks.slotClass('load-more') })) : null] }));
}
//# sourceMappingURL=activity-feed.js.map