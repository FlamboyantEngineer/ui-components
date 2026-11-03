# Testing

`@flamboyantengineer/ui-components/testing` holds helpers for hosts that test screens built from the library. They drive widgets the way a reader does, through a Testing Library `user` from `@testing-library/user-event`, and find elements through the accessible tree and the documented hooks ([HOOK-CONTRACT.md](HOOK-CONTRACT.md)), so a host test does not depend on how a widget is built today. The helpers work with any test runner: they import nothing but `@testing-library/dom` and never a runner's API. The library's own test rules are in [docs/TESTING-GUIDELINES.md](../docs/TESTING-GUIDELINES.md).

## UIC-TESTING-1 - Entry point

### UIC-TESTING-1.1 - A framework-neutral entry point

The package shall export the helpers from `@flamboyantengineer/ui-components/testing` (built to `dist/testing/`) and from nowhere else, so the root entry point loads without Testing Library. At run time the helpers shall import only `@testing-library/dom` besides their own modules and the core storage module; `@testing-library/dom` and `@testing-library/user-event` are optional peer dependencies. A helper that drives a widget takes the `user` as its first argument, typed by the library's `TestUser` (the `click`, `clear`, `keyboard` and `type` methods it calls), and names to match as `NameMatch` (exact text or a pattern). Helpers that wait use Testing Library's `waitFor` and `findBy` queries, which run inside `act` when React Testing Library is loaded.

Implementation: `src/testing/index.ts`, `src/testing/test-user.ts`, `package.json`, `scripts/check-package.mjs`
Verification: `src/testing/index.test.tsx`, `test/package.test.ts`

### UIC-TESTING-1.2 - Memory storage

`createMemoryStorage(initial?)` shall be exported from the testing entry point too: a `UiStorage` for `UiProvider` that keeps values in memory, starts from `initial`, and lets a test read what components persisted.

Implementation: `src/testing/index.ts`, `src/core/storage.ts`
Verification: `src/testing/index.test.tsx`

## UIC-TESTING-2 - Widget drivers

### UIC-TESTING-2.1 - Select an option

`selectOption(user, field, option)` shall press the button that opens a list box (`aria-haspopup="listbox"`) in `field`, which is a `SelectField` or `Combobox` root or that button itself, unless its control is already expanded (`aria-expanded="true"`), wait for the list box it opened (the one its control names in `aria-controls`, else the last in the document) and press the option named `option`. A multiple selection stays open, so consecutive calls pick several options without closing the list.

Implementation: `src/testing/pickers.ts`, `src/testing/popups.ts`
Verification: `src/testing/pickers.test.tsx`

### UIC-TESTING-2.2 - Pick a combobox suggestion

`pickComboboxOption(user, input, { text, option })` shall clear a combobox input, type `text`, wait for the list box and press the option named `option` (`text` when omitted). The typed text and the option travel in one object, since helpers take at most three parameters.

Implementation: `src/testing/pickers.ts`, `src/testing/popups.ts`
Verification: `src/testing/pickers.test.tsx`

### UIC-TESTING-2.3 - Open a menu and choose an item

`openMenu(user, trigger)` shall press a menu trigger and return the menu it opened (the one the trigger names in `aria-controls`, else the last in the document). `chooseMenuItem(user, trigger, name)` shall open the menu and press its item named `name`, whether a plain, checkbox or radio item.

Implementation: `src/testing/menus.ts`, `src/testing/popups.ts`
Verification: `src/testing/menus.test.tsx`

### UIC-TESTING-2.4 - Type a date

`pickDate(user, field, isoDate)` shall type an ISO 8601 date (`YYYY-MM-DD`) into the year, month and day segments (`data-type`) of a date field, pressing each segment in the order the locale draws them, and reject any other text. `field` holds one run of segments: a `DateTimeField` root, or one input (`ui-date-time-field__input`) of a range.

Implementation: `src/testing/pickers.ts`
Verification: `src/testing/pickers.test.tsx`

### UIC-TESTING-2.5 - Expand a tree item

`toggleTreeItem(user, tree, name)` shall press the expand button (`ui-tree__expand`) of the tree row named `name`, expanding or collapsing it, and reject a row without children.

Implementation: `src/testing/collections.ts`
Verification: `src/testing/collections.test.tsx`

### UIC-TESTING-2.6 - Find a table cell

`getTableCell(table, rowName, columnName)` shall return the cell of a table or grid in the row named `rowName` (rows are named by their row header cells) under the column header named `columnName`, matching `aria-colindex` when the row's cells carry it and the header's position otherwise, and throw when there is none. Native `tr`, `th` and `td` elements work through their implicit roles, without explicit `role` attributes.

Implementation: `src/testing/collections.ts`
Verification: `src/testing/collections.test.tsx`

### UIC-TESTING-2.7 - Dismiss an overlay

`dismissOverlay(user, overlay?)` shall press Escape where focus is, which dismisses the overlay holding it, and, given the overlay, wait until it has left the document.

Implementation: `src/testing/menus.ts`
Verification: `src/testing/menus.test.tsx`

## UIC-TESTING-3 - Queries

### UIC-TESTING-3.1 - Hook elements

`getHookElement(root, component, slot?)` shall return `root` or its first descendant carrying the hook class `ui-<component>`, or `ui-<component>__<slot>` with a slot, and throw an error naming the class when none is rendered.

Implementation: `src/testing/queries.ts`
Verification: `src/testing/queries.test.tsx`

### UIC-TESTING-3.2 - Field messages

`getFieldError(field)` shall return the text of the error a field's control announces: the element its `aria-describedby` names in an `__error` or `__message` slot, warnings (`data-severity="warning"`) excluded. `getFieldDescription(field)` shall return the text of the element it names in a `__description` slot. Both return `null` when there is none; `field` is the field's root or its control.

Implementation: `src/testing/queries.ts`
Verification: `src/testing/queries.test.tsx`

## UIC-TESTING-4 - Library test harness

### UIC-TESTING-4.1 - Isolated test files

The library's unit runner shall give each test file a separate DOM realm and module graph, including React Aria's module state. A native observer left by one file shall not hide or alter the next file's rendered controls. Tests shall still unmount rendered roots after each test and query controls through their accessible roles; clearing hidden attributes or including inaccessible elements is not a substitute for isolation.

Implementation: `vitest.config.ts`, `test/setup.ts`
Verification: `test/isolation.test.ts`
