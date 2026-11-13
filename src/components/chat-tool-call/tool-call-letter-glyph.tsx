import { mergeClassNames } from '../../core/hooks.js';

interface ToolCallLetterGlyphProps {
  /** The one letter the box holds. */
  letter: string;
  className?: string | undefined;
}

/**
 * A glyph drawn on the fly for a tool without one: a letter in a rounded outline box, on the same
 * 24 by 24 view box, 1.5 stroke and current colour as the drawn glyphs. The letter takes the
 * surrounding font, so it matches the text beside it.
 */
export function ToolCallLetterGlyph({ letter, className }: ToolCallLetterGlyphProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className={mergeClassNames('ui-glyph', className)}
      data-glyph="letter"
      data-letter={letter}
      aria-hidden="true"
      focusable="false"
    >
      <rect x="3.75" y="3.75" width="16.5" height="16.5" rx="4" />
      <text
        x="12"
        y="12"
        fill="currentColor"
        stroke="none"
        fontSize="13"
        fontWeight="600"
        textAnchor="middle"
        dominantBaseline="central"
      >
        {letter}
      </text>
    </svg>
  );
}
