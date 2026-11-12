'use client';

import { useId } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { Button as AriaButton, Disclosure, DisclosurePanel } from '../../primitives/index.js';
import { useExpandGlyph } from '../expand-toggle/expand-toggle.js';
import { type ChatSource, ChatSourceSummary } from './chat-source-summary.js';

export type { ChatCitationData, ChatCitationProps } from './chat-citation.js';
export { ChatCitation } from './chat-citation.js';
export type { ChatSource } from './chat-source-summary.js';
export { createCitationOverride } from './markdown-citations.js';

/** The data of a sources list, as a message part carries it. */
export interface ChatSourcesData {
  /** The sources in citation order: the first is cited as `[1]`. */
  sources: readonly ChatSource[];
}

export interface ChatSourcesProps extends RefProps<HTMLDivElement>, BaseProps, ChatSourcesData {
  /** Whether the list shows (controlled). */
  isExpanded?: boolean | undefined;
  /** Whether the list shows at first when uncontrolled. Defaults to `false`. */
  defaultExpanded?: boolean | undefined;
  /** Receives each state the reader requests, also while controlled. */
  onExpandedChange?: ((isExpanded: boolean) => void) | undefined;
}

const hooks = createHooks('chat-sources', [
  'trigger',
  'label',
  'indicator',
  'panel',
  'list',
  'item',
  'title',
  'site',
  'snippet',
]);

function SourcesIndicator({ isExpanded }: { isExpanded: boolean }) {
  return <Glyph icon={useExpandGlyph(isExpanded)} className={hooks.slotClass('indicator')} />;
}

/**
 * The sources an answer drew on, collapsed behind a trigger that counts them ("Sources (3)"). Opened,
 * it shows a numbered list of each one's title (linking to it when it has a URL), its site and a
 * snippet. Numbers match `ChatCitation` markers.
 */
export function ChatSources({ ref, sources, className, id, ...rest }: ChatSourcesProps) {
  const strings = useUiStrings();
  const labelId = useId();
  return (
    <Disclosure
      {...rest}
      ref={ref}
      {...hooks.root({ className, props: rest })}
      render={(props) => <div {...props} id={id} />}
    >
      {({ isExpanded }) => (
        <>
          <AriaButton slot="trigger" className={hooks.slotClass('trigger')}>
            <span {...hooks.slot('label')} id={labelId}>
              {strings.chatSourcesLabel(sources.length)}
            </span>
            <SourcesIndicator isExpanded={isExpanded} />
          </AriaButton>
          <DisclosurePanel className={hooks.slotClass('panel')}>
            <ol {...hooks.slot('list')} aria-labelledby={labelId}>
              {sources.map((source) => (
                <li key={source.id} {...hooks.slot('item')}>
                  <ChatSourceSummary source={source} slotClass={hooks.slotClass} />
                </li>
              ))}
            </ol>
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  );
}
