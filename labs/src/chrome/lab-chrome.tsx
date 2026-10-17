import { useId, useState, type FormEvent } from 'react';
import {
  DEFAULT_THEME_ATTRIBUTE,
  isValidThemeAttribute,
  type LabSettings,
  type StylesheetChoice,
} from './settings.js';

export interface LabChromeProps {
  title: string;
  initial: LabSettings;
  /** Builds the href back to the lab index for the current settings; null hides the link. */
  indexHref: ((settings: LabSettings) => string) | null;
  onChange: (settings: LabSettings) => void;
}

type Kind = StylesheetChoice['kind'];

/** The lab toolbar: back to the index, stylesheet picker and theme attribute. */
export function LabChrome({ title, initial, indexHref, onChange }: LabChromeProps) {
  const [settings, setSettings] = useState(initial);
  const [kind, setKind] = useState<Kind>(initial.stylesheet.kind);
  const [url, setUrl] = useState(
    initial.stylesheet.kind === 'custom' ? initial.stylesheet.url : '',
  );
  const [attribute, setAttribute] = useState(initial.themeAttribute);
  const ids = { stylesheet: useId(), url: useId(), theme: useId(), attribute: useId() };

  const commit = (next: LabSettings) => {
    setSettings(next);
    onChange(next);
  };

  const chooseKind = (next: Kind) => {
    setKind(next);
    if (next === 'custom') {
      if (url.trim()) commit({ ...settings, stylesheet: { kind: 'custom', url: url.trim() } });
      return;
    }
    commit({ ...settings, stylesheet: { kind: next } });
  };

  const commitUrl = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = url.trim();
    if (trimmed) commit({ ...settings, stylesheet: { kind: 'custom', url: trimmed } });
  };

  const commitAttribute = () => {
    const name = attribute.trim() || DEFAULT_THEME_ATTRIBUTE;
    if (!isValidThemeAttribute(name)) {
      setAttribute(settings.themeAttribute);
      return;
    }
    setAttribute(name);
    if (name !== settings.themeAttribute) commit({ ...settings, themeAttribute: name });
  };

  return (
    <div className="bar">
      <div className="title">
        {indexHref ? (
          <a className="back" href={indexHref(settings)}>
            All labs
          </a>
        ) : null}
        <span className="name">{title}</span>
      </div>
      <form className="controls" onSubmit={commitUrl}>
        <label htmlFor={ids.stylesheet}>Stylesheet</label>
        <select
          id={ids.stylesheet}
          value={kind}
          onChange={(event) => chooseKind(event.target.value as Kind)}
        >
          <option value="none">Unstyled</option>
          <option value="reference">Reference</option>
          <option value="custom">Custom URL</option>
        </select>
        {kind === 'custom' ? (
          <>
            <label htmlFor={ids.url} className="visually-hidden">
              Stylesheet URL
            </label>
            <input
              id={ids.url}
              type="text"
              inputMode="url"
              placeholder="https://… or /path/app.css"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              onBlur={commitUrl}
            />
            <button type="submit">Apply</button>
          </>
        ) : null}
        <label htmlFor={ids.theme}>Theme</label>
        <input
          id={ids.theme}
          type="text"
          placeholder="none"
          value={settings.theme}
          onChange={(event) => commit({ ...settings, theme: event.target.value.trim() })}
        />
        <label htmlFor={ids.attribute}>on</label>
        <input
          id={ids.attribute}
          type="text"
          className="attribute"
          value={attribute}
          aria-describedby={`${ids.attribute}-hint`}
          onChange={(event) => setAttribute(event.target.value)}
          onBlur={commitAttribute}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commitAttribute();
            }
          }}
        />
        <span id={`${ids.attribute}-hint`} className="visually-hidden">
          Root element attribute that receives the theme value
        </span>
      </form>
    </div>
  );
}

export const chromeStyles = `
:host {
  all: initial;
  display: block;
  position: sticky;
  top: 0;
  z-index: 2147483647;
  color-scheme: light dark;
  font: 13px/1.4 system-ui, -apple-system, 'Segoe UI', sans-serif;
}
.bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  padding: 8px 16px;
  background: Canvas;
  color: CanvasText;
  border-bottom: 1px solid GrayText;
}
.title { display: flex; align-items: baseline; gap: 12px; min-width: 0; }
.name { font-weight: 600; }
.back { color: LinkText; }
.controls { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
label { color: CanvasText; }
select, input, button {
  font: inherit;
  color: FieldText;
  background: Field;
  border: 1px solid GrayText;
  border-radius: 4px;
  padding: 2px 6px;
  min-height: 24px;
  box-sizing: border-box;
}
button { color: ButtonText; background: ButtonFace; cursor: pointer; }
input { width: 14ch; }
input[inputmode='url'] { width: 28ch; }
input.attribute { width: 12ch; }
:focus-visible { outline: 2px solid Highlight; outline-offset: 1px; }
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
@media (max-width: 640px) {
  .bar { padding: 8px; }
  input[inputmode='url'] { width: 100%; }
}
`;
