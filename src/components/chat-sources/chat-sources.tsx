import { useId } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { ChatSourceSummary, type ChatSource } from './chat-source-summary.js';

export type { ChatSource } from './chat-source-summary.js';
export { ChatCitation } from './chat-citation.js';
export type { ChatCitationData, ChatCitationProps } from './chat-citation.js';

/** The data of a sources list, as a message part carries it. */
export interface ChatSourcesData {
  /** The sources in citation order: the first is cited as `[1]`. */
  sources: readonly ChatSource[];
}

export interface ChatSourcesProps extends BaseProps, ChatSourcesData {}

const hooks = createHooks('chat-sources', ['label', 'list', 'item', 'title', 'site', 'snippet']);

/**
 * The sources an answer drew on, as a numbered list labelled by their count: each one's title
 * (linking to it when it has a URL), its site and a snippet. Numbers match `ChatCitation` markers.
 */
export function ChatSources({ sources, className, id, ...rest }: ChatSourcesProps) {
  const strings = useUiStrings();
  const labelId = useId();
  return (
    <div {...hooks.root({ className, props: rest })} id={id}>
      <span {...hooks.slot('label')} id={labelId}>
        {strings.chatSourcesLabel(sources.length)}
      </span>
      <ol {...hooks.slot('list')} aria-labelledby={labelId}>
        {sources.map((source) => (
          <li key={source.id} {...hooks.slot('item')}>
            <ChatSourceSummary source={source} slotClass={hooks.slotClass} />
          </li>
        ))}
      </ol>
    </div>
  );
}
