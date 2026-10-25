// What a list item and a citation's card show of a source: its title (a link when it has a URL),
// its site and its snippet (specs/CHAT-SOURCES.md).

import { Link } from '../link/link.js';

/** A source an answer drew on, such as a web page or a document. */
export interface ChatSource {
  id: string;
  title: string;
  /** Where the source lives. Without it the title is plain text. */
  url?: string | undefined;
  /** The site's name; defaults to the URL's host. */
  siteName?: string | undefined;
  /** A short passage of the source. */
  snippet?: string | undefined;
}

type SummarySlot = 'title' | 'site' | 'snippet';

const absoluteUrl = /^https?:/i;

/** The host of an absolute URL without its `www.`, or undefined for any other value. */
function readHost(url: string | undefined): string | undefined {
  if (!url || !absoluteUrl.test(url)) return undefined;
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

export function isExternalUrl(url: string): boolean {
  return absoluteUrl.test(url);
}

export function ChatSourceSummary({
  source,
  slotClass,
}: {
  source: ChatSource;
  slotClass: (slot: SummarySlot) => string;
}) {
  const site = source.siteName ?? readHost(source.url);
  return (
    <>
      {source.url ? (
        <Link
          className={slotClass('title')}
          href={source.url}
          isExternal={isExternalUrl(source.url)}
        >
          {source.title}
        </Link>
      ) : (
        <span className={slotClass('title')}>{source.title}</span>
      )}
      {site ? <span className={slotClass('site')}>{site}</span> : null}
      {source.snippet ? <p className={slotClass('snippet')}>{source.snippet}</p> : null}
    </>
  );
}
