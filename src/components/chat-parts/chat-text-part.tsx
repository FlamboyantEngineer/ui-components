'use client';
import { Fragment, type ReactNode, useMemo } from 'react';
import { requireDefined } from '../../utils/require-defined.js';
import { useLatest } from '../../utils/use-latest.js';
import { useStableArray } from '../../utils/use-stable-array.js';
import { createCitationOverride } from '../chat-sources/chat-sources.js';
import { createCodeBlockOverride } from '../code-block/code-block.js';
import { Markdown, type MarkdownNode } from '../markdown/markdown.js';
import type { MarkdownNodePlace, MarkdownRenderNode } from '../markdown/markdown-place.js';
import {
  RecordLabel,
  type RecordLabelPresentation,
  type RecordLabelResolver,
} from '../record-label/record-label.js';
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
  type TokenMarker,
  writeTokenSource,
} from './chat-text-tokens.js';

interface ChatTextPartViewProps {
  part: ChatTextPart;
  format: ChatTextFormat;
  /** The message's Markdown overrides, stable across renders. */
  renderNode: MarkdownRenderNode;
  /** How a record reference's chip shows its record. */
  getReference?: RecordLabelResolver | undefined;
}

interface TokenPillProps {
  token: ChatTextToken;
  getReference: RecordLabelResolver | undefined;
  /** The pill sits inside a link or a task label, where its chip must not be a link. */
  isInteractivePlace?: boolean | undefined;
}

/** How a reference chip shows: the host's presentation, without its link inside another control. */
function toPresentation(
  presentation: RecordLabelPresentation | undefined,
  isInteractivePlace: boolean,
): RecordLabelPresentation | undefined {
  if (!presentation || !isInteractivePlace) return presentation;
  const { href: _href, isExternal: _isExternal, preview: _preview, ...shown } = presentation;
  return shown;
}

/**
 * A token's pill: its label, or a record reference's chip, which is not a link inside a link or a
 * task label.
 */
function TokenPill({ token, getReference, isInteractivePlace = false }: TokenPillProps) {
  const { id, label, recordType } = token;
  return (
    <span {...hooks.slot('token', { kind: token.kind })}>
      {token.kind === 'reference' ? (
        <RecordLabel
          mode="chip"
          {...toPresentation(
            getReference?.({ id, label, ...(recordType === undefined ? {} : { recordType }) }),
            isInteractivePlace,
          )}
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
  marker,
  renderNode,
  getReference,
}: {
  tokens: readonly ChatTextToken[];
  marker: TokenMarker;
  renderNode: MarkdownRenderNode;
  getReference: RecordLabelResolver | undefined;
}): MarkdownRenderNode {
  return (node, children, place) => {
    if (node.type !== 'text') return renderNode(node, children, place);
    const pieces = splitTokenMarkers(node.text, tokens.length, marker);
    if (pieces.every((piece) => typeof piece === 'string'))
      return renderNode(node, children, place);
    return pieces.map((piece, at) =>
      typeof piece === 'number' ? (
        <TokenPill
          key={at}
          token={requireDefined(tokens[piece])}
          getReference={getReference}
          isInteractivePlace={place.isInteractive}
        />
      ) : (
        <Fragment key={at}>
          {renderNode({ type: 'text', text: piece }, null, place) ?? <TextMatch>{piece}</TextMatch>}
        </Fragment>
      ),
    );
  };
}

const noTokens: readonly ChatTextToken[] = [];

function MarkdownText({ part, renderNode, getReference }: Omit<ChatTextPartViewProps, 'format'>) {
  // The tokens by content, so a host that rebuilds the array each render keeps the overrides.
  const partTokens = useStableArray(part.tokens ?? noTokens);
  const placed = useMemo(() => {
    const tokens = listTextTokens(part.text, partTokens);
    return { tokens, ...writeTokenSource(part.text, tokens) };
  }, [part.text, partTokens]);
  const { tokens, marker } = placed;
  const nodeRenderer = useMemo(
    () =>
      tokens.length === 0
        ? renderNode
        : createTokenOverride({ tokens, marker, renderNode, getReference }),
    [tokens, marker, renderNode, getReference],
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
): MarkdownRenderNode {
  const sources = useStableArray(
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
    const cite = createCitationOverride(sources);
    return (node: MarkdownNode, children: ReactNode, place: MarkdownNodePlace) =>
      code(node) ?? cite(node, children, place);
  }, [sources, hasApply, latestApply]);
}
