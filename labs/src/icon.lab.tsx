import { glyphCatalog, glyphNames } from './glyph-catalog.js';
import { Icon, toIconProps, type IconSource } from '../../src/components/icon/icon.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const sizes = ['sm', 'md', 'lg'] as const;

const sources: Record<string, { code: string; source: IconSource }> = {
  component: { code: 'glyphCatalog.check', source: glyphCatalog.check },
  element: {
    code: '<svg>…</svg>',
    source: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <rect x="5" y="5" width="14" height="14" rx="2" />
      </svg>
    ),
  },
  null: { code: 'null', source: null },
  undefined: { code: 'undefined', source: undefined },
  false: { code: 'false', source: false },
};

/** What toIconProps returns for a source, in words. */
function describeIconProps(source: IconSource): string {
  const props = toIconProps(source);
  if (props.icon) return 'icon: component';
  if (props.children) return 'children: element';
  return `children: ${String(props.children)}`;
}

mountLab(
  <>
    <LabSection title="Glyphs by size" description="Every built-in glyph in every box size.">
      <StateMatrix
        axes={{ glyph: glyphNames, size: sizes }}
        render={({ glyph, size }) => <Icon icon={glyphCatalog[glyph]} size={size} />}
      />
    </LabSection>
    <LabSection
      title="Sources and accessibility"
      description="Decorative and labelled icons, and an icon drawn from a custom node."
    >
      <StateMatrix
        axes={{ source: ['glyph', 'custom node'], naming: ['decorative', 'labelled'], size: sizes }}
        render={({ source, naming, size }) => (
          <Icon
            size={size}
            {...(source === 'glyph' ? { icon: glyphCatalog.info } : {})}
            {...(naming === 'labelled' ? { label: 'Information' } : {})}
          >
            {source === 'custom node' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <circle cx="12" cy="12" r="8" />
              </svg>
            ) : null}
          </Icon>
        )}
      />
    </LabSection>
    <LabSection
      title="Icon sources through toIconProps"
      description="A component that takes an IconSource passes it through toIconProps: an imported component becomes icon, a rendered element becomes children, and null, undefined and false draw nothing: the host leaves the icon out when toIconProps gives neither."
    >
      <table data-lab-case="icon-sources">
        <thead>
          <tr>
            <th scope="col">Source</th>
            <th scope="col">toIconProps</th>
            <th scope="col">Drawn</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(sources).map(([name, { code, source }]) => (
            <tr key={name} data-lab-source={name}>
              <td>
                <code>{code}</code>
              </td>
              <td data-lab-output="props">{describeIconProps(source)}</td>
              <td>
                {toIconProps(source).icon || toIconProps(source).children ? (
                  <Icon {...toIconProps(source)} label={`Icon from ${name}`} />
                ) : (
                  <span data-lab-output="absent">no icon</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </LabSection>
    <LabSection
      title="Dots at small sizes"
      description="The help, info, error and warning glyphs keep their dots at the small box and in 10 and 12 pixel text; switch the theme to check them on the dark page too."
    >
      <div data-lab-dots>
        <StateMatrix
          axes={{ glyph: ['help', 'info', 'error', 'warning'] as const, size: ['sm', '10', '12'] }}
          render={({ glyph, size }) =>
            size === 'sm' ? (
              <Icon icon={glyphCatalog[glyph]} size="sm" />
            ) : (
              <span style={{ fontSize: Number(size) }}>
                <Icon icon={glyphCatalog[glyph]} size="inherit" /> Ripe pears
              </span>
            )
          }
        />
      </div>
    </LabSection>
    <LabSection
      title="Inherited size"
      description="Icons sized inherit in text of three font sizes: each box follows the font."
    >
      <StateMatrix
        axes={{ fontSize: ['12', '16', '24'], glyph: ['info', 'check'] as const }}
        render={({ fontSize, glyph }) => (
          <span style={{ fontSize: Number(fontSize) }}>
            <Icon icon={glyphCatalog[glyph]} size="inherit" /> Ripe pears
          </span>
        )}
      />
    </LabSection>
  </>,
);
