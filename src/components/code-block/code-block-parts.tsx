'use client';

// The parts a code block is composed of, after shadcn/ui's code block: a header with a title and
// actions, the code as lines that may be added, removed or highlighted, and a footer
// (specs/CODE-BLOCK.md, UIC-CODE-BLOCK-6).

import {
  Children,
  createContext,
  type CSSProperties,
  type ReactNode,
  useContext,
  useId,
  useRef,
} from 'react';
import { measuredProperty } from '../../core/hooks.js';
import type { BaseProps, ContainerProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useMergedRefs } from '../../utils/use-merged-refs.js';
import { useScrollOverflow } from '../../utils/use-scroll-overflow.js';
import type { CodeEditorWrap } from '../code-editor/code-editor.js';
import { CopyButton } from '../copy-button/copy-button.js';
import type { CodeBlockSize, CodeBlockVariant } from './code-block.js';
import { codeBlockHooks as hooks } from './code-block-content.js';

/** How a composed line stands out: `added` and `removed` mark a change, `highlighted` draws the eye. */
export type CodeBlockLineVariant = 'default' | 'added' | 'removed' | 'highlighted';

/** A code block composed from parts; its `variant` is the kind of block, as for a data block. */
export interface CodeBlockFrameProps extends ContainerProps<'div'>, BaseProps {
  /** Composes the block from parts; set only on a data block. */
  code?: undefined;
  /** `code` (the default) shows source; `terminal` mutes output lines. */
  variant?: CodeBlockVariant | undefined;
  /** Padding and type size. Defaults to `default`. */
  size?: CodeBlockSize | undefined;
  /** A `CodeBlockHeader`, a `CodeBlockContent` and a `CodeBlockFooter`. */
  children?: ReactNode;
}

export interface CodeBlockHeaderProps extends ContainerProps<'div'>, BaseProps {}

export interface CodeBlockTitleProps extends ContainerProps<'span'>, BaseProps {}

export interface CodeBlockActionsProps extends ContainerProps<'span'>, BaseProps {}

export interface CodeBlockFooterProps extends ContainerProps<'div'>, BaseProps {}

export interface CodeBlockCopyButtonProps extends RefProps<HTMLSpanElement>, BaseProps {
  /** The text Copy puts on the clipboard. */
  value: string;
  /** Names the button. Defaults to the provider's `codeBlockCopy` string. */
  label?: string | undefined;
}

export interface CodeBlockContentProps extends RefProps<HTMLPreElement>, BaseProps {
  /** `off` (the default) scrolls long lines sideways; `soft` wraps them. */
  wrap?: CodeEditorWrap | undefined;
  /** Numbers its `CodeBlockLine` children, from `firstLineNumber`. */
  lineNumbers?: boolean | undefined;
  /** The number of the first line with `lineNumbers`. Defaults to 1. */
  firstLineNumber?: number | undefined;
  /** The code as text, or one `CodeBlockLine` per line. */
  children?: ReactNode;
}

export interface CodeBlockLineProps extends RefProps<HTMLSpanElement>, BaseProps {
  /** Defaults to `default`. */
  variant?: CodeBlockLineVariant | undefined;
  /** The line's text, without its line break. */
  children?: ReactNode;
}

/** Where a composed line sits among its block's lines, and the number it shows, if any. */
interface LinePlace {
  number: number | null;
  isLast: boolean;
}

const FrameContext = createContext<string | undefined>(undefined);
const LinePlaceContext = createContext<LinePlace>({ number: null, isLast: true });

/** The element that keeps an added or removed line's meaning for assistive technology. */
const changeElements = { added: 'ins', removed: 'del' } as const;

/** The root of a composed code block: a group named by its `CodeBlockTitle` unless labelled. */
export function CodeBlockFrame({
  variant = 'code',
  size = 'default',
  className,
  'aria-label': label,
  'aria-labelledby': labelledBy,
  ...rest
}: CodeBlockFrameProps) {
  const titleId = useId();
  return (
    <FrameContext value={titleId}>
      <div
        {...rest}
        {...hooks.root({ className, data: { variant, size } })}
        role="group"
        aria-label={label}
        aria-labelledby={labelledBy ?? (label === undefined ? titleId : undefined)}
      />
    </FrameContext>
  );
}

/** The row above the code: its title and actions. */
export function CodeBlockHeader({ className, ...rest }: CodeBlockHeaderProps) {
  return <div {...rest} {...hooks.slot('header', undefined, className)} />;
}

/** The block's name, such as a file name or language, which names its group. */
export function CodeBlockTitle({ className, ...rest }: CodeBlockTitleProps) {
  const titleId = useContext(FrameContext);
  return <span {...rest} {...hooks.slot('title', undefined, className)} id={titleId} />;
}

/** The block's commands, such as Copy. */
export function CodeBlockActions({ className, ...rest }: CodeBlockActionsProps) {
  return <span {...rest} {...hooks.slot('actions', undefined, className)} />;
}

/** Copies `value`, as the data block's Copy button does. */
export function CodeBlockCopyButton({ label, className, ...rest }: CodeBlockCopyButtonProps) {
  const strings = useUiStrings();
  return (
    <CopyButton
      {...rest}
      {...hooks.slot('copy', undefined, className)}
      label={label ?? strings.codeBlockCopy}
      size="sm"
    />
  );
}

/** The row below the code, such as a caption or a status. */
export function CodeBlockFooter({ className, ...rest }: CodeBlockFooterProps) {
  return <div {...rest} {...hooks.slot('footer', undefined, className)} />;
}

/**
 * The preformatted code, which scrolls sideways or wraps, and joins the tab order while it
 * overflows. Its `CodeBlockLine` children each learn their place, and their number with
 * `lineNumbers`.
 */
export function CodeBlockContent({
  ref,
  wrap = 'off',
  lineNumbers = false,
  firstLineNumber,
  className,
  children,
  ...rest
}: CodeBlockContentProps) {
  const codeRef = useRef<HTMLPreElement>(null);
  const refs = useMergedRefs(codeRef, ref);
  const isOverflowing = useScrollOverflow(codeRef);
  const lines = Children.toArray(children);
  const first =
    firstLineNumber !== undefined && Number.isInteger(firstLineNumber) && firstLineNumber > 0
      ? firstLineNumber
      : 1;
  const style: CSSProperties | undefined = lineNumbers
    ? measuredProperty(
        'code-block-line-number-digits',
        String(String(first + lines.length - 1).length),
      )
    : undefined;
  return (
    <pre
      {...rest}
      {...hooks.slot('code', { overflowing: isOverflowing, wrap, lineNumbers }, className)}
      ref={refs}
      style={style}
      tabIndex={isOverflowing ? 0 : undefined}
    >
      <code>
        {lines.map((line, index) => (
          <LinePlaceContext
            key={index}
            value={{
              number: lineNumbers ? first + index : null,
              isLast: index === lines.length - 1,
            }}
          >
            {line}
          </LinePlaceContext>
        ))}
      </code>
    </pre>
  );
}

/**
 * One line of composed code, with its line break kept inside it so it can be a block; an `added`
 * line is an `<ins>` and a `removed` one a `<del>`. Its number is an empty decoration, so it never
 * joins the text, a selection or Copy.
 */
export function CodeBlockLine({
  variant = 'default',
  className,
  children,
  ...rest
}: CodeBlockLineProps) {
  const { number, isLast } = useContext(LinePlaceContext);
  const Change = variant === 'added' || variant === 'removed' ? changeElements[variant] : null;
  return (
    <span {...rest} {...hooks.slot('line', { variant }, className)}>
      {number === null ? null : (
        <span {...hooks.slot('line-number')} data-line-number={number} aria-hidden="true" />
      )}
      {Change === null ? children : <Change>{children}</Change>}
      {isLast ? null : '\n'}
    </span>
  );
}
