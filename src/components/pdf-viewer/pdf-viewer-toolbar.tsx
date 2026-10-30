import {
  ChevronDownGlyph,
  ChevronUpGlyph,
  FitPageGlyph,
  FitWidthGlyph,
  MoreVerticalGlyph,
  SidebarGlyph,
  type GlyphComponent,
} from '../../core/glyphs.js';
import type { KeyboardEvent, ReactNode, RefObject } from 'react';
import { Input, Label, NumberField } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu.js';
import { Button } from '../button/button.js';
import { ToolbarScroller } from '../toolbar-scroller/toolbar-scroller.js';
import { ZoomControl } from '../zoom-control/zoom-control.js';
import { pdfViewerHooks as hooks } from './styling-hooks.js';
import { pdfZoomLevels } from './pdf-zoom.js';
import { PdfViewerSearch } from './pdf-viewer-search.js';
import type { PdfSearchControls, PdfSearchState } from './use-pdf-search.js';
import type { PdfZoomState } from './use-pdf-zoom.js';

/** The document commands of the toolbar's menu. */
export interface PdfCommands {
  rotate(degrees: 90 | -90): void;
  print(): void;
  download(): void;
}

interface PdfViewerToolbarProps {
  label: string;
  isReady: boolean;
  zoom: PdfZoomState;
  pageCount: number;
  currentPage: number;
  onPageChange(pageIndex: number): void;
  search: PdfSearchState;
  /** The viewer's own find field. */
  findFieldRef: RefObject<HTMLInputElement | null>;
  sidebar: { isOpen: boolean; setOpen(isOpen: boolean): void };
  commands: PdfCommands;
  /** The viewer's keyboard shortcuts. */
  onKeyDown(event: KeyboardEvent<HTMLElement>): void;
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
  glyph: GlyphComponent;
  /** The provider string that names the button. */
  stringKey: 'fitWidth' | 'fitPage';
}

const wholePercent: Intl.NumberFormatOptions = { maximumFractionDigits: 0 };
const fitModes: readonly PdfFitMode[] = [
  { zoom: 'page-width', glyph: FitWidthGlyph, stringKey: 'fitWidth' },
  { zoom: 'page-fit', glyph: FitPageGlyph, stringKey: 'fitPage' },
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
  const { query, setQuery, options, setOptions, isPending, total, current } = search;
  const { findNext, findPrevious } = search;
  return {
    query,
    setQuery,
    options,
    setOptions,
    isPending,
    total,
    current,
    findNext,
    findPrevious,
  };
}

/** The menu of document commands: rotating the pages, printing them and saving the file. */
function PdfViewerCommands({ isReady, commands }: { isReady: boolean; commands: PdfCommands }) {
  const strings = useUiStrings();
  return (
    <DropdownMenu
      iconOnly
      icon={MoreVerticalGlyph}
      label={strings.moreOptions}
      size="sm"
      isDisabled={!isReady}
      items={[
        {
          id: 'rotate-clockwise',
          label: strings.rotateClockwise,
          onAction: () => commands.rotate(90),
        },
        {
          id: 'rotate-counterclockwise',
          label: strings.rotateCounterclockwise,
          onAction: () => commands.rotate(-90),
        },
        { type: 'separator', id: 'output' },
        { id: 'print', label: strings.print, onAction: commands.print },
        { id: 'download', label: strings.download, onAction: commands.download },
      ]}
    />
  );
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
      <Button
        icon={ChevronUpGlyph}
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
      <Button
        icon={ChevronDownGlyph}
        label={strings.nextPage}
        size="sm"
        isDisabled={!isReady || currentPage >= pageCount - 1}
        onPress={() => onPageChange(currentPage + 1)}
      />
    </div>
  );
}

/**
 * The caller's leading actions, the sidebar toggle, zoom with its fit modes, page navigation, find,
 * the document commands and the caller's actions, in one toolbar.
 */
export function PdfViewerToolbar({
  label,
  isReady,
  zoom,
  search,
  findFieldRef,
  sidebar,
  commands,
  onKeyDown,
  actions,
  leadingActions,
  renderSearch,
  ...page
}: PdfViewerToolbarProps) {
  const strings = useUiStrings();
  return (
    <div {...hooks.slot('toolbar')} onKeyDownCapture={keepCaretKeys} onKeyDown={onKeyDown}>
      <ToolbarScroller aria-label={strings.controlsFor(label)}>
        {leadingActions ? <div {...hooks.slot('leading-actions')}>{leadingActions}</div> : null}
        <Button
          icon={SidebarGlyph}
          label={strings.sidebar}
          size="sm"
          isSelected={sidebar.isOpen}
          isDisabled={!isReady}
          onPress={() => sidebar.setOpen(!sidebar.isOpen)}
        />
        <ZoomControl
          levels={pdfZoomLevels}
          value={zoom.percent}
          onChange={zoom.setZoom}
          formatOptions={wholePercent}
          isDisabled={!isReady}
        />
        {fitModes.map(({ zoom: fit, glyph, stringKey }) => (
          <Button
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
          <PdfViewerSearch search={search} fieldRef={findFieldRef} />
        )}
        <PdfViewerCommands isReady={isReady} commands={commands} />
        {actions ? <div {...hooks.slot('actions')}>{actions}</div> : null}
      </ToolbarScroller>
    </div>
  );
}
