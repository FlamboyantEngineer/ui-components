import { render, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionRow } from '../src/components/action-row/action-row.js';
import { AnnotationLayer, AnnotationMargin } from '../src/components/annotation-layer/index.js';
import { AppFrame } from '../src/components/app-frame/app-frame.js';
import { AppFrameBand } from '../src/components/app-frame/app-frame-band.js';
import { Avatar } from '../src/components/avatar/avatar.js';
import { BooleanField } from '../src/components/boolean-field/boolean-field.js';
import { Button } from '../src/components/button/button.js';
import { Card, CardGrid, CardGridItem, CardTitle } from '../src/components/card/index.js';
import { CascaderField } from '../src/components/cascader-field/cascader-field.js';
import { CharacterGrid } from '../src/components/character-grid/character-grid.js';
import { Chat } from '../src/components/chat/chat.js';
import { ChatHeader } from '../src/components/chat/chat-header.js';
import { ChatPlan } from '../src/components/chat-activity/chat-plan.js';
import { ChatReasoning } from '../src/components/chat-activity/chat-reasoning.js';
import { ChatStatusLine } from '../src/components/chat-activity/chat-status-line.js';
import { ChatSteps } from '../src/components/chat-activity/chat-steps.js';
import { ChatAttachment } from '../src/components/chat-attachment/chat-attachment.js';
import { ChatAttachmentList } from '../src/components/chat-attachment/chat-attachment-list.js';
import { ChatList } from '../src/components/chat-list/chat-list.js';
import { ChatMessageActions } from '../src/components/chat-message-actions/chat-message-actions.js';
import { ChatModelPicker } from '../src/components/chat-model-picker/chat-model-picker.js';
import { ChatParts } from '../src/components/chat-parts/chat-parts.js';
import { ChatQuestion } from '../src/components/chat-question/chat-question.js';
import { ChatCitation } from '../src/components/chat-sources/chat-citation.js';
import { ChatSources } from '../src/components/chat-sources/chat-sources.js';
import { ChatToolCall } from '../src/components/chat-tool-call/chat-tool-call.js';
import { ChatDateSeparator } from '../src/components/chat-transcript/chat-date-separator.js';
import { ChatMessage } from '../src/components/chat-transcript/chat-message.js';
import { ChatQuote } from '../src/components/chat-transcript/chat-quote.js';
import { ChatReadReceipts } from '../src/components/chat-transcript/chat-read-receipts.js';
import { ChatTranscript } from '../src/components/chat-transcript/chat-transcript.js';
import { ChatTypingIndicator } from '../src/components/chat-transcript/chat-typing-indicator.js';
import { ChatUnreadDivider } from '../src/components/chat-transcript/chat-unread-divider.js';
import { Choice, ChoiceGroup } from '../src/components/choice-group/index.js';
import { CodeBlock } from '../src/components/code-block/code-block.js';
import { CodeEditor } from '../src/components/code-editor/code-editor.js';
import { ColorField } from '../src/components/color-field/color-field.js';
import {
  ColorSwatchPicker,
  ColorSwatchPickerItem,
} from '../src/components/color-swatch/color-swatch-picker.js';
import { CommandPalette } from '../src/components/command-palette/command-palette.js';
import { CompletionList } from '../src/components/completion-list/completion-list.js';
import { ConditionBuilder } from '../src/components/condition-builder/condition-builder.js';
import { ContextMenu } from '../src/components/context-menu/context-menu.js';
import { createMenuController } from '../src/components/context-menu/menu-controller.js';
import { DateTimeField } from '../src/components/date-time-field/date-time-field.js';
import { DecimalField } from '../src/components/decimal-field/decimal-field.js';
import { DecisionControl } from '../src/components/decision-control/decision-control.js';
import { DescriptionList, DescriptionRow } from '../src/components/description-list/index.js';
import { DiagramPaletteItem } from '../src/components/diagram-canvas/index.js';
import {
  Disclosure,
  DisclosureHeader,
  DisclosurePanel,
  DisclosureTitle,
} from '../src/components/disclosure/index.js';
import { DisplayOptions } from '../src/components/display-options/display-options.js';
import { DockPanel, DockPanelPane } from '../src/components/dock-panel/index.js';
import { DragHandle } from '../src/components/drag-handle/drag-handle.js';
import { Drawer, DrawerTrigger } from '../src/components/drawer/drawer.js';
import {
  EmojiPicker,
  EmojiPickerBody,
  EmojiPickerPreview,
  EmojiPickerSearch,
  EmojiPickerSkinTones,
} from '../src/components/emoji-picker/index.js';
import { FacetList } from '../src/components/facet-list/facet-list.js';
import { FieldPreviousValue } from '../src/components/field/field-previous-value.js';
import { FileField } from '../src/components/file-field/file-field.js';
import { FileUpload } from '../src/components/file-upload/file-upload.js';
import { FilterBar } from '../src/components/filter-bar/filter-bar.js';
import { FindBar } from '../src/components/find-bar/find-bar.js';
import { FormulaBar } from '../src/components/formula-bar/formula-bar.js';
import { FourSidePropertyStrip } from '../src/components/four-side-property-strip/four-side-property-strip.js';
import { GridSizePicker } from '../src/components/grid-size-picker/grid-size-picker.js';
import { HoverCard, HoverCardTrigger } from '../src/components/hover-card/hover-card.js';
import { HtmlMarkup } from '../src/components/html-markup/html-markup.js';
import { Image } from '../src/components/image/image.js';
import { InlineEdit } from '../src/components/inline-edit/inline-edit.js';
import { InlineTextDiff } from '../src/components/inline-text-diff/inline-text-diff.js';
import {
  ToolbarRow,
  ToolbarRowGroup,
  ToolbarRowSeparator,
} from '../src/components/layout/index.js';
import { ListView, ListViewItem, ListViewSection } from '../src/components/list-row/index.js';
import { LoadingCard, LoadingRegion } from '../src/components/loading-overlay/index.js';
import { MappingTable } from '../src/components/mapping-table/mapping-table.js';
import { Markdown } from '../src/components/markdown/markdown.js';
import { MaskedTextField } from '../src/components/masked-text-field/masked-text-field.js';
import { MediaViewer } from '../src/components/media-viewer/media-viewer.js';
import { Menu, MenuItem, MenuSection, MenuSeparator } from '../src/components/menu/index.js';
import {
  MessageComposer,
  MessageComposerAttachButton,
  MessageComposerEmojiButton,
  MessageComposerMenuButton,
  MessageComposerSelect,
  MessageComposerSendButton,
  MessageComposerToggle,
} from '../src/components/message-composer/index.js';
import { MetaLine } from '../src/components/meta-line/meta-line.js';
import { Modal } from '../src/components/modal/modal.js';
import { MultiDateField } from '../src/components/multi-date-field/multi-date-field.js';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
} from '../src/components/navigation-menu/index.js';
import {
  NavigationRail,
  NavigationRailGroup,
  NavigationRailItem,
  NavigationRailSection,
} from '../src/components/navigation-rail/index.js';
import { NotificationCenter } from '../src/components/notification-center/notification-center.js';
import { NotificationList } from '../src/components/notification-center/notification-list.js';
import { NumberField } from '../src/components/number-field/number-field.js';
import { Pagination } from '../src/components/pagination/pagination.js';
import { PeoplePicker } from '../src/components/people-picker/people-picker.js';
import { PinInput } from '../src/components/pin-input/pin-input.js';
import { Popover, PopoverTrigger } from '../src/components/popover/popover.js';
import { PortalHost } from '../src/components/portal/portal.js';
import { ProblemList } from '../src/components/problem-list/problem-list.js';
import { Meter } from '../src/components/progress-bar/progress-bar.js';
import { PropertyFilter } from '../src/components/property-filter/property-filter.js';
import {
  PropertyCard,
  PropertyGroup,
  PropertyIconGroup,
  PropertyPanel,
  PropertyRow,
  PropertySection,
  PropertyStrip,
  PropertyStripCell,
} from '../src/components/property-panel/index.js';
import { PropertyScope } from '../src/components/property-scope/property-scope.js';
import { ProseTable } from '../src/components/prose-table/prose-table.js';
import { QueryField } from '../src/components/query-field/query-field.js';
import { Rating, RatingField } from '../src/components/rating-field/index.js';
import { RecordHeader } from '../src/components/record-header/record-header.js';
import { RecordLabel } from '../src/components/record-label/record-label.js';
import { RelativeDateField } from '../src/components/relative-date-field/relative-date-field.js';
import { RelativeTime } from '../src/components/relative-time/relative-time.js';
import { FormatToolbar, InsertMenuButton } from '../src/components/rich-text-editor/index.js';
import { RichTextEditor } from '../src/components/rich-text-editor/rich-text-editor.js';
import { SaveStatus } from '../src/components/save-status/save-status.js';
import { SearchField } from '../src/components/search-field/search-field.js';
import { Section, SectionHeader } from '../src/components/section-header/section-header.js';
import { SelectField } from '../src/components/select-field/select-field.js';
import { KeyHints } from '../src/components/shortcut/shortcut.js';
import { SignatureDialog } from '../src/components/signature-dialog/signature-dialog.js';
import { SignaturePad } from '../src/components/signature-pad/signature-pad.js';
import { StatTile } from '../src/components/stat-tile/stat-tile.js';
import { StepListEditor } from '../src/components/step-list-editor/step-list-editor.js';
import { SvgMarkup } from '../src/components/svg-markup/svg-markup.js';
import { TagsInput } from '../src/components/tags-input/tags-input.js';
import { TextField } from '../src/components/text-field/text-field.js';
import { TimeZoneField } from '../src/components/time-zone-field/time-zone-field.js';
import { TimelineItemEditor } from '../src/components/timeline/timeline-item-editor.js';
import { createToastQueue, ToastList, ToastRegion } from '../src/components/toast/toast.js';
import { ToolbarScroller } from '../src/components/toolbar-scroller/toolbar-scroller.js';
import { Tour } from '../src/components/tour/tour.js';
import { TransferList } from '../src/components/transfer-list/transfer-list.js';
import { TransitionMenu } from '../src/components/transition-menu/transition-menu.js';
import { UserCard } from '../src/components/user-card/user-card.js';
import { UserCardTrigger } from '../src/components/user-card-trigger/user-card-trigger.js';
import { ViewSwitcher } from '../src/components/view-switcher/view-switcher.js';
import { VisuallyHidden } from '../src/components/visually-hidden/visually-hidden.js';
import { Wizard } from '../src/components/wizard/wizard.js';
import { ZoomControl } from '../src/components/zoom-control/zoom-control.js';
import { PlusGlyph } from '../src/core/glyphs.js';
import { requireDefined } from '../src/utils/require-defined.js';
import { assistantPeople, getNow, helper } from './chat-fixtures.js';
import { nameQuestion } from './chat-question-fixtures.js';
import { toolCallBase } from './chat-tool-call-fixtures.js';

/** Hands the element a ref receives to `onElement`; a callback fits every root's element type. */
type RefTo = (element: Element | null) => void;

interface RootRefCase {
  /** Renders the component with `ref` on it. */
  element: (ref: RefTo) => ReactElement;
  /** The component's root hook class; its first element in the document is the root. */
  root: string;
}

const source = { id: 'rail', title: 'Coastal rail timetable', url: '/guides/rail' };
const step = { id: 'plan', label: 'Plan the route', status: 'done' } as const;
const conversation = { id: 'ana', title: 'Ana Lima', participants: [{ id: 'ana', name: 'Ana' }] };
const report = { id: 'report', name: 'Trip plan.pdf', mediaType: 'application/pdf', size: 482 };
const model = { id: 'swift', label: 'Swift' };
const notifications = [{ id: 'n1', title: 'Report ready', time: '2026-04-20' }];
const states = [
  { id: 'open', label: 'Open' },
  { id: 'done', label: 'Done' },
];

/** A context menu controller already open at a point, with one entry. */
function openController() {
  const controller = createMenuController();
  controller.open({ x: 10, y: 10 }, { items: [{ id: 'copy', label: 'Copy' }] });
  return controller;
}

/** A toast queue holding one toast. */
function queueWithToast() {
  const queue = createToastQueue({ defaultTimeout: 0 });
  queue.add({ title: 'Saved' });
  return queue;
}

const cases: Record<string, RootRefCase> = {
  Chat: {
    element: (ref) => (
      <Chat ref={ref} participants={assistantPeople} currentUserId="sam" messages={[]} />
    ),
    root: 'ui-chat',
  },
  ChatAttachment: {
    element: (ref) => <ChatAttachment ref={ref} {...report} />,
    root: 'ui-chat-attachment',
  },
  ChatAttachmentList: {
    element: (ref) => <ChatAttachmentList ref={ref} attachments={[report]} />,
    root: 'ui-chat-attachment-list',
  },
  ChatCitation: {
    element: (ref) => <ChatCitation ref={ref} source={source} index={1} />,
    root: 'ui-chat-citation',
  },
  ChatDateSeparator: {
    element: (ref) => <ChatDateSeparator ref={ref} date="2026-04-20" getNow={getNow} />,
    root: 'ui-chat-date-separator',
  },
  ChatHeader: {
    element: (ref) => <ChatHeader ref={ref} title="Trip helper" participants={[helper]} />,
    root: 'ui-chat-header',
  },
  ChatList: {
    element: (ref) => <ChatList ref={ref} conversations={[conversation]} getNow={getNow} />,
    root: 'ui-chat-list',
  },
  ChatMessage: {
    element: (ref) => (
      <ChatMessage ref={ref} id="m1">
        Hello
      </ChatMessage>
    ),
    root: 'ui-chat-message',
  },
  ChatMessageActions: {
    element: (ref) => <ChatMessageActions ref={ref} onReply={() => {}} />,
    root: 'ui-chat-message-actions',
  },
  ChatModelPicker: {
    element: (ref) => <ChatModelPicker ref={ref} models={[model]} />,
    root: 'ui-chat-model-picker',
  },
  ChatParts: {
    element: (ref) => <ChatParts ref={ref} parts={[{ type: 'text', text: 'Hello' }]} />,
    root: 'ui-chat-parts',
  },
  ChatPlan: {
    element: (ref) => <ChatPlan ref={ref} steps={[step]} />,
    root: 'ui-chat-plan',
  },
  ChatQuestion: {
    element: (ref) => (
      <ChatQuestion ref={ref} id="ask" questions={[nameQuestion]} status="pending" />
    ),
    root: 'ui-chat-question',
  },
  ChatQuote: {
    element: (ref) => <ChatQuote ref={ref} authorName="Ana" excerpt="Lunch at noon?" />,
    root: 'ui-chat-quote',
  },
  ChatQuoteButton: {
    element: (ref) => (
      <ChatQuote ref={ref} authorName="Ana" excerpt="Lunch at noon?" onPress={() => {}} />
    ),
    root: 'ui-chat-quote',
  },
  ChatReadReceipts: {
    element: (ref) => <ChatReadReceipts ref={ref} readers={[{ id: 'ana', name: 'Ana' }]} />,
    root: 'ui-chat-read-receipts',
  },
  ChatReasoning: {
    element: (ref) => <ChatReasoning ref={ref} text="Thinking it through" status="complete" />,
    root: 'ui-chat-reasoning',
  },
  ChatSources: {
    element: (ref) => <ChatSources ref={ref} sources={[source]} />,
    root: 'ui-chat-sources',
  },
  ChatStatusLine: {
    element: (ref) => <ChatStatusLine ref={ref} text="Searching" />,
    root: 'ui-chat-status-line',
  },
  ChatSteps: {
    element: (ref) => <ChatSteps ref={ref}>Steps</ChatSteps>,
    root: 'ui-chat-steps',
  },
  ChatToolCall: {
    element: (ref) => <ChatToolCall ref={ref} {...toolCallBase} status="succeeded" />,
    root: 'ui-chat-tool-call',
  },
  ChatTranscript: {
    element: (ref) => <ChatTranscript ref={ref} aria-label="Messages" />,
    root: 'ui-chat-transcript',
  },
  ChatTypingIndicator: {
    element: (ref) => <ChatTypingIndicator ref={ref} names={['Ana']} />,
    root: 'ui-chat-typing-indicator',
  },
  ChatUnreadDivider: {
    element: (ref) => <ChatUnreadDivider ref={ref} />,
    root: 'ui-chat-unread-divider',
  },
  CommandPalette: {
    element: (ref) => (
      <CommandPalette ref={ref} items={[{ id: 'new', label: 'New file' }]} defaultOpen />
    ),
    root: 'ui-command-palette',
  },
  ContextMenu: {
    element: (ref) => <ContextMenu ref={ref} controller={openController()} />,
    root: 'ui-menu-popover',
  },
  Drawer: {
    element: (ref) => (
      <DrawerTrigger defaultOpen>
        <Button>Filters</Button>
        <Drawer ref={ref} title="Filters">
          Body
        </Drawer>
      </DrawerTrigger>
    ),
    root: 'ui-drawer',
  },
  EmojiPicker: {
    element: (ref) => <EmojiPicker ref={ref} loadEmoji={() => new Promise(() => {})} />,
    root: 'ui-emoji-picker',
  },
  EmojiPickerBody: {
    element: (ref) => (
      <EmojiPicker loadEmoji={() => new Promise(() => {})}>
        <EmojiPickerBody ref={ref} />
      </EmojiPicker>
    ),
    root: 'ui-emoji-picker__message',
  },
  EmojiPickerPreview: {
    element: (ref) => (
      <EmojiPicker loadEmoji={() => new Promise(() => {})}>
        <EmojiPickerPreview ref={ref} />
      </EmojiPicker>
    ),
    root: 'ui-emoji-picker__preview',
  },
  EmojiPickerSkinTones: {
    element: (ref) => (
      <EmojiPicker loadEmoji={() => new Promise(() => {})}>
        <EmojiPickerSkinTones ref={ref} />
      </EmojiPicker>
    ),
    root: 'ui-emoji-picker__skin-tones',
  },
  HoverCard: {
    element: (ref) => (
      <HoverCardTrigger defaultOpen>
        <Button>Owner</Button>
        <HoverCard ref={ref} aria-label="Preview">
          Ana
        </HoverCard>
      </HoverCardTrigger>
    ),
    root: 'ui-hover-card',
  },
  Menu: {
    element: (ref) => (
      <Menu ref={ref} aria-label="Edit">
        <MenuItem id="cut">Cut</MenuItem>
      </Menu>
    ),
    root: 'ui-menu',
  },
  MenuItem: {
    element: (ref) => (
      <Menu aria-label="Edit">
        <MenuItem ref={ref} id="cut">
          Cut
        </MenuItem>
      </Menu>
    ),
    root: 'ui-menu-item',
  },
  MenuSection: {
    element: (ref) => (
      <Menu aria-label="Edit">
        <MenuSection ref={ref} title="Clipboard">
          <MenuItem id="cut">Cut</MenuItem>
        </MenuSection>
      </Menu>
    ),
    root: 'ui-menu-section',
  },
  MenuSeparator: {
    element: (ref) => (
      <Menu aria-label="Edit">
        <MenuItem id="cut">Cut</MenuItem>
        <MenuSeparator ref={ref} />
        <MenuItem id="undo">Undo</MenuItem>
      </Menu>
    ),
    root: 'ui-menu-separator',
  },
  Modal: {
    element: (ref) => (
      <Modal ref={ref} title="Settings" isOpen>
        Body
      </Modal>
    ),
    root: 'ui-modal',
  },
  NotificationCenter: {
    element: (ref) => <NotificationCenter ref={ref} items={notifications} />,
    root: 'ui-notification-center',
  },
  NotificationList: {
    element: (ref) => <NotificationList ref={ref} items={notifications} getNow={getNow} />,
    root: 'ui-notification-list',
  },
  Popover: {
    element: (ref) => (
      <PopoverTrigger defaultOpen>
        <Button>Filters</Button>
        <Popover ref={ref} title="Filters">
          Body
        </Popover>
      </PopoverTrigger>
    ),
    root: 'ui-popover',
  },
  ToastList: {
    element: (ref) => <ToastList ref={ref} queue={queueWithToast()} />,
    root: 'ui-toast-list',
  },
  ToastRegion: {
    element: (ref) => <ToastRegion ref={ref} queue={queueWithToast()} />,
    root: 'ui-toast-region',
  },
  Tour: {
    element: (ref) => (
      <>
        <button type="button" id="share">
          Share
        </button>
        <Tour
          ref={ref}
          steps={[{ target: '#share', title: 'Share', content: 'Send it.' }]}
          defaultOpen
        />
      </>
    ),
    root: 'ui-tour',
  },
  TransitionMenu: {
    element: (ref) => (
      <TransitionMenu
        ref={ref}
        states={states}
        value="open"
        transitions={[{ id: 'finish', to: 'done', label: 'Finish' }]}
        onTransition={() => {}}
      />
    ),
    root: 'ui-transition-menu',
  },
  UserCardTrigger: {
    element: (ref) => (
      <UserCardTrigger ref={ref} card={<UserCard name="Ana" />}>
        Ana
      </UserCardTrigger>
    ),
    root: 'ui-user-card-trigger',
  },
};

/** Fields: each forwards `ref` to the root of the `Field` it renders. */
const fieldCases: Record<string, RootRefCase> = {
  BooleanField: { element: (ref) => <BooleanField ref={ref} label="Ripe" />, root: 'ui-field' },
  RatingField: { element: (ref) => <RatingField ref={ref} label="Quality" />, root: 'ui-field' },
  TimeZoneField: { element: (ref) => <TimeZoneField ref={ref} label="Zone" />, root: 'ui-field' },
  CascaderField: {
    element: (ref) => <CascaderField ref={ref} label="Place" options={[]} />,
    root: 'ui-field',
  },
  ChoiceGroup: {
    element: (ref) => (
      <ChoiceGroup ref={ref} label="Size">
        <Choice value="small">Small</Choice>
      </ChoiceGroup>
    ),
    root: 'ui-field',
  },
  CodeEditor: { element: (ref) => <CodeEditor ref={ref} label="Query" />, root: 'ui-field' },
  ColorField: { element: (ref) => <ColorField ref={ref} label="Colour" />, root: 'ui-field' },
  DateTimeField: { element: (ref) => <DateTimeField ref={ref} label="Due" />, root: 'ui-field' },
  DecimalField: { element: (ref) => <DecimalField ref={ref} label="Weight" />, root: 'ui-field' },
  FileField: {
    element: (ref) => <FileField ref={ref} label="Attachments" onSelect={() => {}} />,
    root: 'ui-field',
  },
  MaskedTextField: {
    element: (ref) => <MaskedTextField ref={ref} label="Code" mask="999-999" />,
    root: 'ui-field',
  },
  MultiDateField: {
    element: (ref) => <MultiDateField ref={ref} label="Days" />,
    root: 'ui-field',
  },
  NumberField: { element: (ref) => <NumberField ref={ref} label="Count" />, root: 'ui-field' },
  PinInput: { element: (ref) => <PinInput ref={ref} label="Code" length={4} />, root: 'ui-field' },
  RelativeDateField: {
    element: (ref) => <RelativeDateField ref={ref} label="Due" />,
    root: 'ui-field',
  },
  RichTextEditor: {
    element: (ref) => <RichTextEditor ref={ref} label="Notes" />,
    root: 'ui-field',
  },
  SelectField: {
    element: (ref) => (
      <SelectField ref={ref} label="Fruit" options={[{ id: 'apple', label: 'Apple' }]} />
    ),
    root: 'ui-field',
  },
  SignaturePad: {
    element: (ref) => <SignaturePad ref={ref} label="Signature" />,
    root: 'ui-field',
  },
  TagsInput: { element: (ref) => <TagsInput ref={ref} label="Tags" />, root: 'ui-field' },
  TextField: { element: (ref) => <TextField ref={ref} label="Street" />, root: 'ui-field' },
};

/** Inputs that are not built on `Field`. */
const inputCases: Record<string, RootRefCase> = {
  Choice: {
    element: (ref) => (
      <ChoiceGroup label="Size">
        <Choice ref={ref} value="small">
          Small
        </Choice>
      </ChoiceGroup>
    ),
    root: 'ui-choice',
  },
  ChoiceInMultipleGroup: {
    element: (ref) => (
      <ChoiceGroup label="Toppings" selectionMode="multiple">
        <Choice ref={ref} value="olives">
          Olives
        </Choice>
      </ChoiceGroup>
    ),
    root: 'ui-choice',
  },
  ColorSwatchPicker: {
    element: (ref) => (
      <ColorSwatchPicker ref={ref} aria-label="Colours">
        <ColorSwatchPickerItem color="#ff0000" />
      </ColorSwatchPicker>
    ),
    root: 'ui-color-swatch-picker',
  },
  ColorSwatchPickerItem: {
    element: (ref) => (
      <ColorSwatchPicker aria-label="Colours">
        <ColorSwatchPickerItem ref={ref} color="#ff0000" />
      </ColorSwatchPicker>
    ),
    root: 'ui-color-swatch-picker__item',
  },
  EmojiPickerSearch: {
    element: (ref) => (
      <EmojiPicker loadEmoji={() => new Promise(() => {})}>
        <EmojiPickerSearch ref={ref} />
      </EmojiPicker>
    ),
    root: 'ui-emoji-picker__search',
  },
  FieldPreviousValue: {
    element: (ref) => <FieldPreviousValue ref={ref}>Apple</FieldPreviousValue>,
    root: 'ui-field-previous-value',
  },
  FileUpload: {
    element: (ref) => <FileUpload ref={ref} label="Attach" onSelect={() => {}} />,
    root: 'ui-file-upload',
  },
  GridSizePicker: {
    element: (ref) => <GridSizePicker ref={ref} onSelect={() => {}} />,
    root: 'ui-grid-size-picker',
  },
  PeoplePicker: {
    element: (ref) => (
      <PeoplePicker ref={ref} label="Owner" loadItems={() => Promise.resolve([])} />
    ),
    root: 'ui-people-picker',
  },
  QueryField: {
    element: (ref) => <QueryField ref={ref} label="Query" grammar={{}} />,
    root: 'ui-query-field',
  },
  SearchField: {
    element: (ref) => <SearchField ref={ref} label="Search" />,
    root: 'ui-search-field',
  },
};

/** Composer controls, placed in a composer's start controls. */
function inComposer(control: ReactElement) {
  return <MessageComposer aria-label="Message" startControls={control} onAttach={() => {}} />;
}

/** Panels, collections, content and the composer's controls. */
const panelCases: Record<string, RootRefCase> = {
  ActionRow: {
    element: (ref) => <ActionRow ref={ref} actions={[{ verb: 'edit', onPress: () => {} }]} />,
    root: 'ui-action-row',
  },
  AnnotationLayer: {
    element: (ref) => (
      <AnnotationLayer ref={ref} annotations={[]}>
        <p>Text</p>
      </AnnotationLayer>
    ),
    root: 'ui-annotation-layer',
  },
  AnnotationMargin: {
    element: (ref) => (
      <AnnotationLayer annotations={[]}>
        <p>Text</p>
        <AnnotationMargin ref={ref} renderCard={() => 'Note'} />
      </AnnotationLayer>
    ),
    root: 'ui-annotation-layer__margin',
  },
  AppFrameBand: {
    element: (ref) => <AppFrameBand ref={ref} aria-label="Tools" leading="Logo" />,
    root: 'ui-app-frame-band',
  },
  CardGridItem: {
    element: (ref) => (
      <CardGrid aria-label="Cards">
        <CardGridItem ref={ref} id="tea" textValue="Tea">
          <Card title="Tea">Green</Card>
        </CardGridItem>
      </CardGrid>
    ),
    root: 'ui-card-grid-item',
  },
  CardTitle: {
    element: (ref) => <Card header={<CardTitle ref={ref}>Report</CardTitle>}>Body</Card>,
    root: 'ui-card__title',
  },
  CharacterGrid: {
    element: (ref) => <CharacterGrid ref={ref} categories={[]} onSelect={() => {}} />,
    root: 'ui-character-grid',
  },
  CodeBlock: {
    element: (ref) => <CodeBlock ref={ref} code="let a = 1;" language="ts" />,
    root: 'ui-code-block',
  },
  ConditionBuilder: {
    element: (ref) => <ConditionBuilder ref={ref} fields={[]} />,
    root: 'ui-condition-builder',
  },
  DecisionControl: {
    element: (ref) => <DecisionControl ref={ref} onSubmit={() => {}} />,
    root: 'ui-decision-control',
  },
  DescriptionRow: {
    element: (ref) => (
      <DescriptionList>
        <DescriptionRow ref={ref} label="Title">
          Value
        </DescriptionRow>
      </DescriptionList>
    ),
    root: 'ui-description-list__row',
  },
  DiagramPaletteItem: {
    element: (ref) => <DiagramPaletteItem ref={ref} type="tank" label="Tank" />,
    root: 'ui-diagram-canvas__palette-item',
  },
  DisclosureHeader: {
    element: (ref) => (
      <Disclosure>
        <DisclosureHeader ref={ref}>
          <DisclosureTitle>Notes</DisclosureTitle>
        </DisclosureHeader>
        <DisclosurePanel>Body</DisclosurePanel>
      </Disclosure>
    ),
    root: 'ui-disclosure__header',
  },
  DisclosurePanel: {
    element: (ref) => (
      <Disclosure>
        <DisclosureTitle>Notes</DisclosureTitle>
        <DisclosurePanel ref={ref}>Body</DisclosurePanel>
      </Disclosure>
    ),
    root: 'ui-disclosure__panel',
  },
  DisclosureTitle: {
    element: (ref) => (
      <Disclosure>
        <DisclosureTitle ref={ref}>Notes</DisclosureTitle>
        <DisclosurePanel>Body</DisclosurePanel>
      </Disclosure>
    ),
    root: 'ui-disclosure__heading',
  },
  DisplayOptions: {
    element: (ref) => <DisplayOptions ref={ref} properties={[]} />,
    root: 'ui-display-options',
  },
  DockPanel: {
    element: (ref) => (
      <DockPanel ref={ref} label="Details">
        <DockPanelPane id="notes" label="Notes" icon={PlusGlyph}>
          Notes
        </DockPanelPane>
      </DockPanel>
    ),
    root: 'ui-dock-panel',
  },
  DockPanelPane: {
    element: (ref) => (
      <DockPanel label="Details">
        <DockPanelPane ref={ref} id="notes" label="Notes" icon={PlusGlyph}>
          Notes
        </DockPanelPane>
      </DockPanel>
    ),
    root: 'ui-dock-panel__pane',
  },
  DragHandle: {
    element: (ref) => <DragHandle ref={ref} aria-label="Drag" />,
    root: 'ui-drag-handle',
  },
  FacetList: {
    element: (ref) => (
      <FacetList ref={ref} label="City" options={[{ value: 'oslo', label: 'Oslo', count: 2 }]} />
    ),
    root: 'ui-facet-list',
  },
  FilterBar: {
    element: (ref) => <FilterBar ref={ref} fields={[]} value={[]} />,
    root: 'ui-filter-bar',
  },
  FindBar: { element: (ref) => <FindBar ref={ref} />, root: 'ui-find-bar' },
  FormulaBar: {
    element: (ref) => <FormulaBar ref={ref} cell={{ row: 0, column: 0 }} value="" />,
    root: 'ui-formula-bar',
  },
  HtmlMarkup: {
    element: (ref) => <HtmlMarkup ref={ref} markup="<p>Hello</p>" />,
    root: 'ui-html-markup',
  },
  InlineEdit: {
    element: (ref) => <InlineEdit ref={ref} label="Title" value="Rye loaf" onSave={() => {}} />,
    root: 'ui-inline-edit',
  },
  InlineTextDiff: {
    element: (ref) => <InlineTextDiff ref={ref} segments={[{ kind: 'text', text: 'red' }]} />,
    root: 'ui-inline-text-diff',
  },
  ListView: {
    element: (ref) => (
      <ListView ref={ref} aria-label="Fruit">
        <ListViewItem id="apple" title="Apple" />
      </ListView>
    ),
    root: 'ui-list-view',
  },
  ListViewItem: {
    element: (ref) => (
      <ListView aria-label="Fruit">
        <ListViewItem ref={ref} id="apple" title="Apple" />
      </ListView>
    ),
    root: 'ui-list-view-item',
  },
  ListViewSection: {
    element: (ref) => (
      <ListView aria-label="Fruit">
        <ListViewSection ref={ref} title="Pome">
          <ListViewItem id="apple" title="Apple" />
        </ListViewSection>
      </ListView>
    ),
    root: 'ui-list-view-section',
  },
  LoadingCard: { element: (ref) => <LoadingCard ref={ref} />, root: 'ui-loading-card' },
  LoadingRegion: {
    element: (ref) => <LoadingRegion ref={ref}>Body</LoadingRegion>,
    root: 'ui-loading-region',
  },
  MappingTable: {
    element: (ref) => <MappingTable ref={ref} columns={[]} targets={[]} />,
    root: 'ui-mapping-table',
  },
  Markdown: { element: (ref) => <Markdown ref={ref} source="Hello" />, root: 'ui-markdown' },
  MediaViewer: {
    element: (ref) => (
      <MediaViewer
        ref={ref}
        items={[{ id: 'pear', src: '/pear.png', name: 'Pear', type: 'image/png' }]}
        isOpen
      />
    ),
    root: 'ui-modal',
  },
  MessageComposerAttachButton: {
    element: (ref) => inComposer(<MessageComposerAttachButton ref={ref} />),
    root: 'ui-message-composer__attach',
  },
  MessageComposerEmojiButton: {
    element: (ref) => inComposer(<MessageComposerEmojiButton ref={ref} />),
    root: 'ui-message-composer__emoji',
  },
  MessageComposerMenuButton: {
    element: (ref) => inComposer(<MessageComposerMenuButton ref={ref} sections={[]} />),
    root: 'ui-message-composer__menu-button',
  },
  MessageComposerSelect: {
    element: (ref) =>
      inComposer(
        <MessageComposerSelect
          ref={ref}
          label="Approval"
          options={[{ id: 'ask', label: 'Ask', icon: PlusGlyph }]}
        />,
      ),
    root: 'ui-message-composer__select',
  },
  MessageComposerSendButton: {
    element: (ref) => (
      <MessageComposer aria-label="Message" endControls={<MessageComposerSendButton ref={ref} />} />
    ),
    root: 'ui-message-composer__action',
  },
  MessageComposerToggle: {
    element: (ref) => inComposer(<MessageComposerToggle ref={ref} label="Plan" icon={PlusGlyph} />),
    root: 'ui-message-composer__toggle',
  },
  MetaLine: { element: (ref) => <MetaLine ref={ref} items={['Apple']} />, root: 'ui-meta-line' },
  ToolbarRowGroup: {
    element: (ref) => (
      <ToolbarRow aria-label="Format">
        <ToolbarRowGroup ref={ref} aria-label="Text">
          <Button>Bold</Button>
        </ToolbarRowGroup>
      </ToolbarRow>
    ),
    root: 'ui-toolbar-row__group',
  },
  ToolbarRowSeparator: {
    element: (ref) => (
      <ToolbarRow aria-label="Format">
        <Button>Bold</Button>
        <ToolbarRowSeparator ref={ref} />
        <Button>Undo</Button>
      </ToolbarRow>
    ),
    root: 'ui-toolbar-row__separator',
  },
  UserCard: { element: (ref) => <UserCard ref={ref} name="Ana" />, root: 'ui-user-card' },
};

const anchor = { current: null as Element | null };

/** Navigation, property panels, records, editors' parts and the remaining content. */
const restCases: Record<string, RootRefCase> = {
  AppFrame: { element: (ref) => <AppFrame ref={ref}>Body</AppFrame>, root: 'ui-app-frame' },
  Avatar: { element: (ref) => <Avatar ref={ref} name="Ana Lima" />, root: 'ui-avatar' },
  AvatarButton: {
    element: (ref) => <Avatar ref={ref} name="Ana Lima" onPress={() => {}} />,
    root: 'ui-avatar',
  },
  Image: { element: (ref) => <Image ref={ref} src="/photo.jpg" alt="Photo" />, root: 'ui-image' },
  CardGrid: {
    element: (ref) => (
      <CardGrid ref={ref} aria-label="Cards">
        <CardGridItem id="tea" textValue="Tea">
          <Card title="Tea">Green</Card>
        </CardGridItem>
      </CardGrid>
    ),
    root: 'ui-card-grid',
  },
  CompletionList: {
    element: (ref) => (
      <>
        <input aria-label="Query" ref={(node) => void (anchor.current = node)} />
        <CompletionList
          ref={ref}
          aria-label="Suggestions"
          isOpen
          anchorRef={anchor}
          items={[{ id: 'apple', label: 'Apple' }]}
          activeKey={null}
          onAction={() => {}}
        />
      </>
    ),
    root: 'ui-completion-list',
  },
  FormatToolbar: {
    element: (ref) => <RichTextEditor label="Notes" toolbar={<FormatToolbar ref={ref} />} />,
    root: 'ui-format-toolbar',
  },
  FourSidePropertyStrip: {
    element: (ref) => (
      <FourSidePropertyStrip ref={ref} label="Padding" renderSide={(side) => <span>{side}</span>} />
    ),
    root: 'ui-four-side-property-strip',
  },
  InsertMenuButton: {
    element: (ref) => (
      <RichTextEditor label="Notes" toolbar={<InsertMenuButton ref={ref} items={[]} />} />
    ),
    root: 'ui-insert-menu-button',
  },
  KeyHints: {
    element: (ref) => (
      <KeyHints ref={ref} hints={[{ keys: ['Enter'], action: 'Send' }]} platform="windows" />
    ),
    root: 'ui-key-hints',
  },
  NavigationMenu: {
    element: (ref) => (
      <NavigationMenu ref={ref} aria-label="Site">
        <NavigationMenuLink href="/">Home</NavigationMenuLink>
      </NavigationMenu>
    ),
    root: 'ui-navigation-menu',
  },
  NavigationMenuItem: {
    element: (ref) => (
      <NavigationMenu aria-label="Site">
        <NavigationMenuItem ref={ref} id="fruit" label="Fruit">
          <NavigationMenuLink href="/fruit">Fruit</NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenu>
    ),
    root: 'ui-navigation-menu__item',
  },
  NavigationMenuLink: {
    element: (ref) => (
      <NavigationMenu aria-label="Site">
        <NavigationMenuLink ref={ref} href="/">
          Home
        </NavigationMenuLink>
      </NavigationMenu>
    ),
    root: 'ui-navigation-menu__link',
  },
  NavigationRail: {
    element: (ref) => (
      <NavigationRail ref={ref} aria-label="Main">
        <NavigationRailItem label="Plan" href="/plan" />
      </NavigationRail>
    ),
    root: 'ui-navigation-rail',
  },
  NavigationRailGroup: {
    element: (ref) => (
      <NavigationRail aria-label="Main">
        <NavigationRailGroup ref={ref} label="Fields">
          <NavigationRailItem label="North" href="/north" />
        </NavigationRailGroup>
      </NavigationRail>
    ),
    root: 'ui-navigation-rail__item',
  },
  NavigationRailItem: {
    element: (ref) => (
      <NavigationRail aria-label="Main">
        <NavigationRailItem ref={ref} label="Plan" href="/plan" />
      </NavigationRail>
    ),
    root: 'ui-navigation-rail__item',
  },
  NavigationRailSection: {
    element: (ref) => (
      <NavigationRail aria-label="Main">
        <NavigationRailSection ref={ref} title="Pinned">
          <NavigationRailItem label="Plan" href="/plan" />
        </NavigationRailSection>
      </NavigationRail>
    ),
    root: 'ui-navigation-rail__section',
  },
  Meter: {
    element: (ref) => <Meter ref={ref} aria-label="Storage" value={40} />,
    root: 'ui-meter',
  },
  Rating: { element: (ref) => <Rating ref={ref} value={3} />, root: 'ui-rating' },
  Pagination: { element: (ref) => <Pagination ref={ref} pageCount={3} />, root: 'ui-pagination' },
  PortalHost: { element: (ref) => <PortalHost ref={ref}>Body</PortalHost>, root: 'ui-portal-host' },
  ProblemList: { element: (ref) => <ProblemList ref={ref} />, root: 'ui-problem-list' },
  PropertyCard: {
    element: (ref) => (
      <PropertyCard ref={ref} name="Body">
        <PropertyRow label="Value">1.5</PropertyRow>
      </PropertyCard>
    ),
    root: 'ui-property-card',
  },
  PropertyFilter: {
    element: (ref) => (
      <PropertyFilter ref={ref} aria-label="Shape">
        <PropertyRow label="Width">10</PropertyRow>
      </PropertyFilter>
    ),
    root: 'ui-property-filter',
  },
  PropertyGroup: {
    element: (ref) => (
      <PropertyGroup ref={ref} heading="Paper">
        <PropertyRow label="Size">A4</PropertyRow>
      </PropertyGroup>
    ),
    root: 'ui-property-group',
  },
  PropertyIconGroup: {
    element: (ref) => (
      <PropertyIconGroup ref={ref} aria-label="Tools">
        <button type="button">A</button>
      </PropertyIconGroup>
    ),
    root: 'ui-property-icon-group',
  },
  PropertyPanel: {
    element: (ref) => (
      <PropertyPanel ref={ref} aria-label="Inspector">
        <PropertyRow label="Width">10</PropertyRow>
      </PropertyPanel>
    ),
    root: 'ui-property-panel',
  },
  PropertyRow: {
    element: (ref) => (
      <PropertyRow ref={ref} label="Width">
        10
      </PropertyRow>
    ),
    root: 'ui-property-row',
  },
  PropertyScope: {
    element: (ref) => (
      <PropertyScope ref={ref} query="">
        <PropertyRow label="Width">10</PropertyRow>
      </PropertyScope>
    ),
    root: 'ui-property-scope',
  },
  PropertySection: {
    element: (ref) => (
      <PropertySection ref={ref} title="Page setup">
        <PropertyRow label="Size">A4</PropertyRow>
      </PropertySection>
    ),
    root: 'ui-property-section',
  },
  PropertyStrip: {
    element: (ref) => (
      <PropertyStrip ref={ref}>
        <PropertyStripCell letter="B" label="Before">
          <input aria-label="Space before" />
        </PropertyStripCell>
      </PropertyStrip>
    ),
    root: 'ui-property-strip',
  },
  PropertyStripCell: {
    element: (ref) => (
      <PropertyStrip>
        <PropertyStripCell ref={ref} letter="B" label="Before">
          <input aria-label="Space before" />
        </PropertyStripCell>
      </PropertyStrip>
    ),
    root: 'ui-property-strip-cell',
  },
  ProseTable: {
    element: (ref) => (
      <ProseTable ref={ref} header={[{ key: 'fruit', content: 'Fruit' }]} rows={[]} />
    ),
    root: 'ui-prose-table',
  },
  RecordHeader: {
    element: (ref) => <RecordHeader ref={ref} identifier="REQ-12" title="Cooling rack" />,
    root: 'ui-record-header',
  },
  RecordLabel: {
    element: (ref) => <RecordLabel ref={ref} identifier="REQ-12" />,
    root: 'ui-record-label',
  },
  RecordLabelChip: {
    element: (ref) => <RecordLabel ref={ref} mode="chip" identifier="REQ-12" />,
    root: 'ui-record-label',
  },
  RecordLabelLink: {
    element: (ref) => <RecordLabel ref={ref} identifier="REQ-12" href="/req/12" />,
    root: 'ui-record-label',
  },
  RelativeTime: {
    element: (ref) => <RelativeTime ref={ref} value="2026-04-20T10:00:00" getNow={getNow} />,
    root: 'ui-relative-time',
  },
  SaveStatus: { element: (ref) => <SaveStatus ref={ref} phase="saved" />, root: 'ui-save-status' },
  Section: {
    element: (ref) => (
      <Section ref={ref} title="Stops">
        Body
      </Section>
    ),
    root: 'ui-section',
  },
  SectionHeader: {
    element: (ref) => <SectionHeader ref={ref} title="Stops" />,
    root: 'ui-section-header',
  },
  SignatureDialog: {
    element: (ref) => (
      <SignatureDialog
        ref={ref}
        title="Sign"
        userName="Ada"
        meanings={[{ id: 'approve', label: 'Approve' }]}
        onSign={() => {}}
        isOpen
      />
    ),
    root: 'ui-signature-dialog',
  },
  StatTile: { element: (ref) => <StatTile ref={ref} label="Uptime" />, root: 'ui-stat-tile' },
  StepListEditor: {
    element: (ref) => (
      <StepListEditor ref={ref} columns={[{ id: 'step', label: 'Step' }]} defaultValue={[]} />
    ),
    root: 'ui-step-list-editor',
  },
  SvgMarkup: {
    element: (ref) => <SvgMarkup ref={ref} markup="<svg><circle r='2'/></svg>" />,
    root: 'ui-svg-markup',
  },
  TimelineItemEditor: {
    element: (ref) => (
      <TimelineItemEditor
        ref={ref}
        item={{
          id: 'measure',
          rowId: 'rooms',
          label: 'Measure rooms',
          start: '2026-04-20',
          end: '2026-04-21',
        }}
        onSave={() => {}}
        onClose={() => {}}
      />
    ),
    root: 'ui-timeline-item-editor',
  },
  ToolbarScroller: {
    element: (ref) => (
      <ToolbarScroller
        ref={ref}
        items={[{ id: 'bold', label: 'Bold' }]}
        renderItem={() => <Button>Bold</Button>}
      />
    ),
    root: 'ui-toolbar-scroller',
  },
  TransferList: {
    element: (ref) => (
      <TransferList ref={ref} aria-label="Cities" items={[{ id: 'oslo', label: 'Oslo' }]} />
    ),
    root: 'ui-transfer-list',
  },
  ViewSwitcher: {
    element: (ref) => (
      <ViewSwitcher ref={ref} views={[{ id: 'rows', label: 'Rows' }]}>
        Rows
      </ViewSwitcher>
    ),
    root: 'ui-view-switcher',
  },
  VisuallyHidden: {
    element: (ref) => <VisuallyHidden ref={ref}>Remove</VisuallyHidden>,
    root: 'ui-visually-hidden',
  },
  Wizard: {
    element: (ref) => (
      <Wizard
        ref={ref}
        aria-label="Trip"
        steps={[{ id: 'where', label: 'Where', content: 'Body' }]}
      />
    ),
    root: 'ui-wizard',
  },
  ZoomControl: {
    element: (ref) => <ZoomControl ref={ref} levels={[50, 100]} defaultValue={100} />,
    root: 'ui-zoom-control',
  },
};

describe('root refs', () => {
  beforeEach(() => {
    // jsdom has neither; a drawer watches its snap points and the reduced-motion setting.
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe() {}
        disconnect() {}
      },
    );
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
    }));
    // Nor scrollTo, which a drawer's snap points call.
    Element.prototype.scrollTo = () => {};
    return () => {
      vi.unstubAllGlobals();
      // @ts-expect-error -- jsdom has no scrollTo; the stub goes away with the test.
      delete Element.prototype.scrollTo;
    };
  });

  it.each(Object.entries({ ...cases, ...fieldCases, ...inputCases, ...panelCases, ...restCases }))(
    'UIC-COMPOSITION-2.5 %s forwards ref to its root',
    async (_name, { element, root }) => {
      const received: Element[] = [];
      render(
        element((node) => {
          if (node) received.push(node);
        }),
      );
      // Some roots, such as a completion list's, show a frame after they mount.
      const outermost = await waitFor(() => requireDefined(document.querySelector(`.${root}`)));
      expect(received.at(-1)).toBe(outermost);
    },
  );
});
