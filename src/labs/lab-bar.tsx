'use client';

import { type FormEvent, useId, useState } from 'react';
import {
  SegmentedChoice,
  type SegmentedChoiceOption,
} from '../components/segmented-choice/segmented-choice.js';
import { VisuallyHidden } from '../components/visually-hidden/visually-hidden.js';
import { EditGlyph, ThemeDarkGlyph, ThemeLightGlyph, ThemeSystemGlyph } from '../core/glyphs.js';
import type { RefProps } from '../core/props.js';
import {
  DEFAULT_THEME_ATTRIBUTE,
  isValidThemeAttribute,
  type LabSettings,
  type LabStylesheet,
  settingsSearch,
  SYSTEM_THEME,
} from './lab-settings.js';

export interface LabBarProps extends RefProps<HTMLDivElement> {
  /** The page's name, shown at the start of the bar. */
  title: string;
  /** The settings the bar starts from; it keeps its own state after that. */
  defaultSettings: LabSettings;
  /** The lab index, linked as "All labs" with the current settings in its query; null hides it. */
  indexHref: string | null;
  /** Receives every settings change the reader commits. */
  onChange: (settings: LabSettings) => void;
}

type Kind = LabStylesheet['kind'];

/** The theme choices the switch names; any other value is a custom one typed in. */
const themeChoices = [SYSTEM_THEME, 'light', 'dark'] as const;
type ThemeChoice = (typeof themeChoices)[number] | 'custom';

const themeOptions: readonly SegmentedChoiceOption[] = [
  { value: SYSTEM_THEME, label: 'System', icon: ThemeSystemGlyph },
  { value: 'light', label: 'Light', icon: ThemeLightGlyph },
  { value: 'dark', label: 'Dark', icon: ThemeDarkGlyph },
  { value: 'custom', label: 'Custom', icon: EditGlyph },
];

function toThemeChoice(theme: string): ThemeChoice {
  return (themeChoices as readonly string[]).includes(theme) ? (theme as ThemeChoice) : 'custom';
}

/** The bar's draft values and the actions that commit them. */
type BarState = ReturnType<typeof useBarState>;

/** The settings the bar has committed, plus the stylesheet kind, URL and attribute being edited. */
function useBarState(initial: LabSettings, onChange: (settings: LabSettings) => void) {
  const [settings, setSettings] = useState(initial);
  const [kind, setKind] = useState<Kind>(initial.stylesheet.kind);
  const [url, setUrl] = useState(
    initial.stylesheet.kind === 'custom' ? initial.stylesheet.url : '',
  );
  const [attribute, setAttribute] = useState(initial.themeAttribute);
  const [themeChoice, setThemeChoice] = useState(toThemeChoice(initial.theme));

  const commit = (next: LabSettings) => {
    setSettings(next);
    onChange(next);
  };
  const commitUrl = () => {
    const trimmed = url.trim();
    if (trimmed) commit({ ...settings, stylesheet: { kind: 'custom', url: trimmed } });
  };
  return {
    settings,
    kind,
    url,
    attribute,
    themeChoice,
    setUrl,
    setAttribute,
    commit,
    commitUrl,
    chooseTheme(next: ThemeChoice) {
      setThemeChoice(next);
      // A custom theme starts empty, which writes nothing until a value is typed.
      commit({ ...settings, theme: next === 'custom' ? '' : next });
    },
    chooseKind(next: Kind) {
      setKind(next);
      if (next === 'custom') commitUrl();
      else commit({ ...settings, stylesheet: { kind: next } });
    },
    commitAttribute() {
      const name = attribute.trim() || DEFAULT_THEME_ATTRIBUTE;
      if (!isValidThemeAttribute(name)) {
        setAttribute(settings.themeAttribute);
        return;
      }
      setAttribute(name);
      if (name !== settings.themeAttribute) commit({ ...settings, themeAttribute: name });
    },
  };
}

function StylesheetFields({ bar }: { bar: BarState }) {
  const ids = { stylesheet: useId(), url: useId() };
  return (
    <>
      <label htmlFor={ids.stylesheet}>Stylesheet</label>
      <select
        id={ids.stylesheet}
        value={bar.kind}
        onChange={(event) => bar.chooseKind(event.target.value as Kind)}
      >
        <option value="none">Unstyled</option>
        <option value="reference">Reference</option>
        <option value="custom">Custom URL</option>
      </select>
      {bar.kind === 'custom' ? (
        <>
          <VisuallyHidden as="span">
            <label htmlFor={ids.url}>Stylesheet URL</label>
          </VisuallyHidden>
          <input
            id={ids.url}
            type="text"
            inputMode="url"
            placeholder="https://… or /path/app.css"
            value={bar.url}
            onChange={(event) => bar.setUrl(event.target.value)}
            onBlur={bar.commitUrl}
          />
          <button type="submit">Apply</button>
        </>
      ) : null}
    </>
  );
}

function ThemeFields({ bar }: { bar: BarState }) {
  const ids = { theme: useId(), value: useId(), attribute: useId(), hint: useId() };
  return (
    <>
      <span id={ids.theme} data-lab-part="group-label">
        Theme
      </span>
      <SegmentedChoice
        aria-labelledby={ids.theme}
        options={themeOptions}
        value={bar.themeChoice}
        onChange={(next) => {
          if (next !== null) bar.chooseTheme(next as ThemeChoice);
        }}
        size="sm"
        sizing="content"
      />
      {bar.themeChoice === 'custom' ? (
        <>
          <VisuallyHidden as="span">
            <label htmlFor={ids.value}>Theme value</label>
          </VisuallyHidden>
          <input
            id={ids.value}
            type="text"
            placeholder="none"
            value={bar.settings.theme}
            onChange={(event) => bar.commit({ ...bar.settings, theme: event.target.value.trim() })}
          />
        </>
      ) : null}
      <label htmlFor={ids.attribute}>on</label>
      <input
        id={ids.attribute}
        type="text"
        data-lab-part="attribute"
        value={bar.attribute}
        aria-describedby={ids.hint}
        onChange={(event) => bar.setAttribute(event.target.value)}
        onBlur={bar.commitAttribute}
        onKeyDown={(event) => {
          if (event.key !== 'Enter') return;
          event.preventDefault();
          bar.commitAttribute();
        }}
      />
      <VisuallyHidden as="span" id={ids.hint}>
        Root data attribute that receives the theme value, excluding data-lab attributes
      </VisuallyHidden>
    </>
  );
}

/**
 * The top bar of a lab page: the page's name, a link back to the lab index, the stylesheet picker
 * and the theme switch. `mountLabBar` draws it in an isolated shadow root and applies its changes.
 */
export function LabBar({ title, defaultSettings, indexHref, onChange, ref }: LabBarProps) {
  const bar = useBarState(defaultSettings, onChange);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    bar.commitUrl();
  };
  return (
    <div ref={ref} data-lab-part="bar">
      <div data-lab-part="title">
        {indexHref === null ? null : (
          <a data-lab-part="back" href={`${indexHref}${settingsSearch(bar.settings)}`}>
            All labs
          </a>
        )}
        <span data-lab-part="name">{title}</span>
      </div>
      <form data-lab-part="controls" onSubmit={submit}>
        <StylesheetFields bar={bar} />
        <ThemeFields bar={bar} />
      </form>
    </div>
  );
}
