// A text part: Markdown with code blocks and citations, or plain text keeping its line breaks,
// with mention and command tokens as pills and record references as record chips in both
// (specs/CHAT-PARTS.md, UIC-CHAT-PARTS-2).

import { Fragment, useMemo, type ReactNode } from 'react';
import { requireDefined } from '../../utils/require-defined.js';
import { useLatest } from '../../utils/use-latest.js';
import { createCitationOverride, type ChatSource } from '../chat-sources/chat-sources.js';
import { createCodeBlockOverride } from '../code-block/code-block.js';
import { Markdown, type MarkdownNode } from '../markdown/markdown.js';
import { RecordLabel, type RecordLabelResolver } from '../record-label/record-label.js';
import { TextMatch } from '../text-match/text-match.js';
import type {
  ChatCodePart,
  ChatPart,
  ChatTextFormat,
  ChatTextPart,
  ChatTextToken,
} from './chat-part.js';
import { chatPartsHooks as hooks } from './chat-parts-hooks.js';
import {
  listTextTokens,
  splitTextTokens,
  splitTokenMarkers,
  writeTokenSource,
} from './chat-text-tokens.js';

/** A Markdown `renderNode`. */
export type MarkdownNodeRenderer = (node: MarkdownNode, children: ReactNode) => ReactNode;

interface ChatTextPartViewProps {
  part: ChatTextPart;
  format: ChatTextFormat;
  /** The message's Markdown overrides, stable across renders. */
  renderNode: MarkdownNodeRenderer;
  /** How a record reference's chip shows its record. */
  getReference?: RecordLabelResolver | undefined;
}

interface TokenPillProps {
  token: ChatTextToken;
  getReference: RecordLabelResolver | undefined;
}

/** A token's pill: its label, or a record reference's chip. */
function TokenPill({ token, getReference }: TokenPillProps) {
  const { id, label, recordType } = token;
  return (
    <span {...hooks.slot('token', { kind: token.kind })}>
      {token.kind === 'reference' ? (
        <RecordLabel
          mode="chip"
          {...getReference?.({ id, label, ...(recordType === undefined ? {} : { recordType }) })}
          identifier={label}
        />
      ) : (
        <TextMatch>{label}</TextMatch>
      )}
    </span>
  );
}

function PlainLines({ text }: { text: string }) {
  return text.split('\n').map((line, index) => (
    <Fragment key={index}>
      {index > 0 ? <br /> : null}
      <TextMatch>{line}</TextMatch>
    </Fragment>
  ));
}

function PlainText({ part, getReference }: Pick<ChatTextPartViewProps, 'part' | 'getReference'>) {
  const tokens = listTextTokens(part.text, part.tokens);
  return (
    <div {...hooks.slot('text', { format: 'plain' })}>
      {splitTextTokens(part.text, tokens).map((piece, at) =>
        typeof piece === 'number' ? (
          <TokenPill key={at} token={requireDefined(tokens[piece])} getReference={getReference} />
        ) : (
          <PlainLines key={at} text={piece} />
        ),
      )}
    </div>
  );
}

/** Draws the token markers in text nodes as pills, and hands everything else to `renderNode`. */
function createTokenOverride({
  tokens,
  renderNode,
  getReference,
}: {
  tokens: readonly ChatTextToken[];
  renderNode: MarkdownNodeRenderer;
  getReference: RecordLabelResolver | undefined;
}): MarkdownNodeRenderer {
  return (node, children) => {
    if (node.type !== 'text') return renderNode(node, children);
    const pieces = splitTokenMarkers(node.text, tokens.length);
    if (pieces.every((piece) => typeof piece === 'string')) return renderNode(node, children);
    return pieces.map((piece, at) =>
      typeof piece === 'number' ? (
        <TokenPill key={at} token={requireDefined(tokens[piece])} getReference={getReference} />
      ) : (
        <Fragment key={at}>
          {renderNode({ type: 'text', text: piece }, null) ?? <TextMatch>{piece}</TextMatch>}
        </Fragment>
      ),
    );
  };
}

function MarkdownText({ part, renderNode, getReference }: Omit<ChatTextPartViewProps, 'format'>) {
  // The tokens by content, so a host that rebuilds the array each render keeps the overrides.
  const tokensKey = JSON.stringify(part.tokens ?? []);
  const placed = useMemo(() => {
    const tokens = listTextTokens(part.text, JSON.parse(tokensKey) as ChatTextToken[]);
    return { tokens, source: writeTokenSource(part.text, tokens) };
  }, [part.text, tokensKey]);
  const nodeRenderer = useMemo(
    () =>
      placed.tokens.length === 0
        ? renderNode
        : createTokenOverride({ tokens: placed.tokens, renderNode, getReference }),
    [placed.tokens, renderNode, getReference],
  );
  return (
    <Markdown
      source={placed.source}
      isStreaming={part.status === 'streaming'}
      renderNode={nodeRenderer}
      className={hooks.slotClass('text')}
      data-format="markdown"
    />
  );
}

/** A text part, as Markdown or as plain text. */
export function ChatTextPartView({
  part,
  format,
  renderNode,
  getReference,
}: ChatTextPartViewProps) {
  return format === 'plain' ? (
    <PlainText part={part} getReference={getReference} />
  ) : (
    <MarkdownText part={part} renderNode={renderNode} getReference={getReference} />
  );
}

/**
 * The message's Markdown overrides: fenced code as `CodeBlock` (with Apply when `onApplyCode` is
 * given) and `[n]` markers as citations of the sources of its `sources` parts. They stay the same
 * while the sources and the presence of `onApplyCode` do, so streaming keeps finished blocks.
 */
export function usePartsRenderNode(
  parts: readonly ChatPart[],
  onApplyCode: ((code: string, part: ChatCodePart) => void) | undefined,
): MarkdownNodeRenderer {
  const sourcesKey = JSON.stringify(
    parts.flatMap((part) => (part.type === 'sources' ? part.sources : [])),
  );
  const latestApply = useLatest(onApplyCode);
  const hasApply = onApplyCode !== undefined;
  return useMemo(() => {
    const code = createCodeBlockOverride({
      onApply: hasApply
        ? (value, language) =>
            latestApply.current?.(value, {
              type: 'code',
              code: value,
              language: language ?? undefined,
            })
        : undefined,
    });
    const cite = createCitationOverride(JSON.parse(sourcesKey) as ChatSource[]);
    return (node: MarkdownNode) => code(node) ?? cite(node);
  }, [sourcesKey, hasApply, latestApply]);
}
