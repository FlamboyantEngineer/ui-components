'use client';

import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { CodeBlock } from '../code-block/code-block.js';
import type { CodeTokenizer } from '../code-editor/code-editor.js';
import { snippetFieldHooks as hooks } from './snippet-field-hooks.js';
import type { SnippetRequest } from './snippet-request.js';
import type { SnippetPreview } from './use-snippet-preview.js';

/** The heading of a snippet's code: its source, then its lines when it has a range. */
export function useSnippetTitle() {
  const strings = useUiStrings();
  return ({ source, lines }: SnippetRequest) =>
    lines ? `${source} · ${strings.snippetLines(lines.start, lines.end)}` : source;
}

/** The saved snippet's code, or a note that there is none. */
export function SnippetSaved(props: {
  value: {
    source: string;
    lines: SnippetRequest['lines'];
    code: string;
    language?: string | undefined;
  } | null;
  tokenize: CodeTokenizer | undefined;
}) {
  const strings = useUiStrings();
  const title = useSnippetTitle();
  if (!props.value) return <p {...hooks.slot('empty')}>{strings.snippetEmpty}</p>;
  return (
    <CodeBlock
      className={hooks.slotClass('saved')}
      code={props.value.code}
      language={props.value.language}
      title={title(props.value)}
      tokenize={props.tokenize}
      lineNumbers
    />
  );
}

/** What the preview says about itself: loading, failed, the saved code again, or newer code. */
function readStatus(
  preview: Exclude<SnippetPreview, { status: 'idle' }>,
  options: { isUnchanged: boolean; isStale: boolean },
  strings: ReturnType<typeof useUiStrings>,
) {
  if (preview.status === 'loading') return strings.snippetLoading;
  if (preview.status === 'error') return preview.message;
  if (options.isUnchanged) return strings.snippetUnchanged;
  return options.isStale ? strings.snippetStale : '';
}

/**
 * A loaded, loading or failed preview with its actions: Apply saves a ready preview, and says
 * Update when it replaces the saved snippet of the same source and lines; Cancel drops it.
 */
export function SnippetPreviewPanel(props: {
  preview: Exclude<SnippetPreview, { status: 'idle' }>;
  isUnchanged: boolean;
  isStale: boolean;
  isDisabled: boolean;
  tokenize: CodeTokenizer | undefined;
  onApply: () => void;
  onCancel: () => void;
}) {
  const strings = useUiStrings();
  const title = useSnippetTitle();
  const { preview } = props;
  const status = readStatus(preview, props, strings);
  return (
    <div {...hooks.slot('preview', { status: preview.status, stale: props.isStale })}>
      <p {...hooks.slot('status')} role="status">
        {status}
      </p>
      {preview.status === 'ready' ? (
        <CodeBlock
          code={preview.code}
          language={preview.language}
          title={title(preview.request)}
          tokenize={props.tokenize}
          lineNumbers
        />
      ) : null}
      <Button
        className={hooks.slotClass('apply')}
        variant="primary"
        size="sm"
        isDisabled={props.isDisabled || preview.status !== 'ready' || props.isUnchanged}
        onPress={props.onApply}
      >
        {props.isStale ? strings.snippetUpdate : strings.snippetApply}
      </Button>
      <Button className={hooks.slotClass('cancel')} size="sm" onPress={props.onCancel}>
        {strings.cancel}
      </Button>
    </div>
  );
}
