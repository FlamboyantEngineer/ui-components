import type { KeyboardEvent, ReactNode } from 'react';
import { Input, Label, NumberField } from 'react-aria-components';
import type { GlyphName } from '../../core/glyphs.js';
import { useUiStrings } from '../../core/provider.js';
import { IconButton } from '../icon-button/icon-button.js';
import { ToolbarScroller } from '../toolbar-scroller/toolbar-scroller.js';
import { ZoomControl } from '../zoom-control/zoom-control.js';
import { pdfViewerHooks as hooks } from './styling-hooks.js';
import { pdfZoomLevels } from './pdf-zoom.js';
import { PdfViewerSearch } from './pdf-viewer-search.js';
import type { PdfSearchControls, PdfSearchState } from './use-pdf-search.js';
import type { PdfZoomState } from './use-pdf-zoom.js';

export interface PdfViewerToolbarProps {
  label: string;
  isReady: boolean;
  zoom: PdfZoomState;
  pageCount: number;
  currentPage: number;
  onPageChange(pageIndex: number): void;
  search: PdfSearchState;
  actions?: ReactNode;
  leadingActions?: ReactNode;
  /** Draws the find controls in place of the viewer's own. */
  renderSearch?: ((search: PdfSearchControls) => ReactNode) | undefined;
}

type PdfViewerPageNavProps = Pick<
  PdfViewerToolbarProps,
  'isReady' | 'pageCount' | 'currentPage' | 'onPageChange'
>;

interface PdfFitMode {
  zoom: 'page-width' | 'page-fit';
  glyph: GlyphName;
  /** The provider string that names the button. */
  stringKey: 'fitWidth' | 'fitPage';
}

const wholePercent: Intl.NumberFormatOptions = { maximumFractionDigits: 0 };
const fitModes: readonly PdfFitMode[] = [
  { zoom: 'page-width', glyph: 'fit-width', stringKey: 'fitWidth' },
  { zoom: 'page-fit', glyph: 'fit-page', stringKey: 'fitPage' },
];

/**
 * The toolbar moves focus with the left and right arrow keys; a text field inside it keeps them for
 * its caret, except at the ends of its text.
 */
function keepCaretKeys(event: KeyboardEvent<HTMLElement>) {
  const field = event.target;
  if (!(field instanceof HTMLInputElement) || field.selectionStart === null) return;
  const { selectionStart, selectionEnd, value } = field;
  const atStart = selectionStart === 0 && selectionEnd === 0;
  const atEnd = selectionStart === value.length && selectionEnd === value.length;
  if ((event.key === 'ArrowLeft' && !atStart) || (event.key === 'ArrowRight' && !atEnd)) {
    event.stopPropagation();
  }
}

/** The find state a caller's controls receive, without the viewer's highlight bookkeeping. */
function pickSearchControls(search: PdfSearchControls): PdfSearchControls {
  const { query, setQuery, isPending, total, current, findNext, findPrevious } = search;
  return { query, setQuery, isPending, total, current, findNext, findPrevious };
}

function PdfViewerPageNav({
  isReady,
  pageCount,
  currentPage,
  onPageChange,
}: PdfViewerPageNavProps) {
  const strings = useUiStrings();
  return (
    <div {...hooks.slot('group')}>
      <IconButton
        icon="chevron-up"
        label={strings.previousPage}
        size="sm"
        isDisabled={!isReady || currentPage <= 0}
        onPress={() => onPageChange(currentPage - 1)}
      />
      <NumberField
        className={hooks.slotClass('page-field')}
        value={currentPage + 1}
        minValue={1}
        maxValue={Math.max(pageCount, 1)}
        formatOptions={{ useGrouping: false }}
        isDisabled={!isReady}
        isWheelDisabled
        onChange={(pageNumber) => {
          if (Number.isFinite(pageNumber)) onPageChange(pageNumber - 1);
        }}
      >
        <Label className={hooks.slotClass('page-label')}>{strings.page}</Label>
        <Input className={hooks.slotClass('page-input')} />
      </NumberField>
      <span {...hooks.slot('page-total')}>{strings.ofTotal(pageCount)}</span>
      <IconButton
        icon="chevron-down"
        label={strings.nextPage}
        size="sm"
        isDisabled={!isReady || currentPage >= pageCount - 1}
        onPress={() => onPageChange(currentPage + 1)}
      />
    </div>
  );
}

/**
 * The caller's leading actions, zoom with its fit modes, page navigation, find and the caller's
 * actions, in one toolbar.
 */
export function PdfViewerToolbar({
  label,
  isReady,
  zoom,
  search,
  actions,
  leadingActions,
  renderSearch,
  ...page
}: PdfViewerToolbarProps) {
  const strings = useUiStrings();
  return (
    <div {...hooks.slot('toolbar')} onKeyDownCapture={keepCaretKeys}>
      <ToolbarScroller aria-label={strings.controlsFor(label)}>
        {leadingActions ? <div {...hooks.slot('leading-actions')}>{leadingActions}</div> : null}
        <ZoomControl
          levels={pdfZoomLevels}
          value={zoom.percent}
          onChange={zoom.setZoom}
          formatOptions={wholePercent}
          isDisabled={!isReady}
        />
        {fitModes.map(({ zoom: fit, glyph, stringKey }) => (
          <IconButton
            key={fit}
            icon={glyph}
            label={strings[stringKey]}
            size="sm"
            isSelected={zoom.zoom === fit}
            isDisabled={!isReady}
            onPress={() => zoom.setZoom(fit)}
          />
        ))}
        <PdfViewerPageNav isReady={isReady} {...page} />
        {renderSearch ? (
          renderSearch(pickSearchControls(search))
        ) : (
          <PdfViewerSearch search={search} />
        )}
        {actions ? <div {...hooks.slot('actions')}>{actions}</div> : null}
      </ToolbarScroller>
    </div>
  );
}
