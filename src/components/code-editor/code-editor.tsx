'use client';

import { useMemo } from 'react';
import type { FieldInputProps } from '../field/field.js';
import { CodeField } from './code-field.js';
import { type CodeLanguage, type CodeSyntax, resolveCodeTokenizer } from './code-languages.js';
import { type CodeEditorSize, CodeSurface, type CodeSurfaceProps } from './code-surface.js';
import type { JsonSchema } from './json-schema.js';

interface CodeLanguageOptions {
  /** Basic syntax preset. Defaults to plain `text`. */
  language?: CodeLanguage | undefined;
  /** Custom syntax rules; override the preset. An explicit tokenizer overrides both. */
  syntax?: CodeSyntax | undefined;
}
export interface CodeEditorFieldProps
  extends
    Omit<FieldInputProps<string>, 'size'>,
    Omit<CodeSurfaceProps, keyof FieldInputProps<string> | 'ref'>,
    CodeLanguageOptions {
  /** A field with label, validation, dirty state, restore, undo and menu. Defaults to `field`. */
  variant?: 'field' | undefined;
  /** Starting surface height. Defaults to md. */
  size?: CodeEditorSize | undefined;
  /** JSON Schema validation, completion and hover documentation in JSON mode. */
  schema?: JsonSchema | undefined;
}
export interface CodeEditorSurfaceProps extends CodeSurfaceProps, CodeLanguageOptions {
  /** A controlled editing surface for embedding inside other fields or widgets. */
  variant: 'surface';
}
export type CodeEditorProps = CodeEditorFieldProps | CodeEditorSurfaceProps;

/** An embedded surface; a custom `syntax` builds its tokenizer once, not on every render. */
function SurfaceEditor(props: CodeEditorSurfaceProps) {
  const { variant: _variant, syntax, language = 'text', ...surface } = props;
  const tokenize = useMemo(
    () => surface.tokenize ?? resolveCodeTokenizer({ language, syntax }),
    [surface.tokenize, language, syntax],
  );
  return <CodeSurface {...surface} language={language} tokenize={tokenize} />;
}

/** A code field, or an embedded surface, with preset or custom syntax and located diagnostics. */
export function CodeEditor(props: CodeEditorProps) {
  return props.variant === 'surface' ? <SurfaceEditor {...props} /> : <CodeField {...props} />;
}

export type { CodeLanguage, CodeSyntax, CodeSyntaxRule } from './code-languages.js';
export type { CodeDiagnostic, CodeToken, CodeTokenizer } from './code-layers.js';
export type { CodeEditorResize, CodeEditorSize, CodeEditorWrap } from './code-surface.js';
export type { JsonSchema, JsonSchemaType } from './json-schema.js';
