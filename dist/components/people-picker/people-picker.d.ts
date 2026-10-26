import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, ControlSize, Key } from '../../core/props.js';
import { type AvatarIdentity } from '../avatar/avatar.js';
import { type ComboboxProps, type ComboboxSelectionMode } from '../combobox/combobox.js';
/** A person or a group the picker lists. */
export interface PeoplePickerPerson extends AvatarIdentity {
    id: Key;
    /** A secondary line: an email, a role, a group's member count. */
    description?: string | undefined;
    /** The person cannot be picked, for example an inactive account. */
    isDisabled?: boolean | undefined;
    /** Why a disabled person cannot be picked, shown in place of the description. */
    disabledReason?: string | undefined;
}
/** One page of a search's people; a `cursor` means another page follows. */
export interface PeoplePickerPage {
    items: readonly PeoplePickerPerson[];
    /** Passed back to the loader to fetch the next page; absent on the last page. */
    cursor?: string | undefined;
}
/**
 * Fetches the people and groups matching the typed text, or with `cursor` the page after the one
 * that returned it; it should stop when `signal` aborts.
 */
export type PeoplePickerLoader = (query: string, signal: AbortSignal, cursor?: string) => Promise<readonly PeoplePickerPerson[] | PeoplePickerPage>;
export interface PeoplePickerProps<M extends ComboboxSelectionMode = 'single'> extends BaseProps, AriaLabellingProps, Pick<ComboboxProps<M>, 'selectionMode' | 'value' | 'defaultValue' | 'onChange' | 'label' | 'description' | 'errorMessage' | 'placeholder' | 'isDisabled' | 'isReadOnly' | 'isInvalid' | 'isRequired' | 'searchDelay'> {
    /** Field size. Defaults to `md`. */
    size?: Extract<ControlSize, 'sm' | 'md' | 'lg'> | undefined;
    /** Searches people and groups as the reader types. Keep it stable: a new loader searches again. */
    loadItems: PeoplePickerLoader;
    /** The person using the app, listed first before a search and marked wherever listed. */
    currentUser?: PeoplePickerPerson | undefined;
    /** People chosen recently, listed under a heading before a search. */
    recent?: readonly PeoplePickerPerson[] | undefined;
    /** People listed before a search without a heading, such as those a saved value holds, so their names show without a search. */
    knownPeople?: readonly PeoplePickerPerson[] | undefined;
}
/**
 * A field for choosing one or more people or groups, on `Combobox`: it searches through `loadItems`
 * as the reader types, lists the current user, known and recent people before a search, draws each person
 * with `UserIdentity`, and shows chosen people of a multiple picker as chips with their avatars.
 */
export declare function PeoplePicker<M extends ComboboxSelectionMode = 'single'>({ loadItems, currentUser, recent, knownPeople, size, className, ...rest }: PeoplePickerProps<M>): import("react").JSX.Element;
//# sourceMappingURL=people-picker.d.ts.map