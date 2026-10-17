import { Icon } from '../../src/components/icon/icon.js';
import { SvgMarkup } from '../../src/components/svg-markup/svg-markup.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const svgNamespace = 'xmlns="http://www.w3.org/2000/svg"';

const markups = ['outline', 'solid', 'multi-path', 'gradient'] as const;

const placements = ['standalone', 'icon sm', 'icon md', 'icon lg'] as const;

const unsafeMarkup = `<svg ${svgNamespace} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" onload="window.unsafe = true"><script>window.unsafe = true</script><a href="javascript:window.unsafe = true"><rect x="4" y="4" width="16" height="16" rx="3"/></a></svg>`;

/** A small registry of drawings kept as markup strings, as a host icon registry would. */
function registry(suffix: string): Record<string, string> {
  return {
    outline: `<svg ${svgNamespace} fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><circle cx="12" cy="12" r="9"/><path stroke-linecap="round" d="M12 8v8M8 12h8"/></svg>`,
    solid: `<svg ${svgNamespace} viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M4 4h16v16H4Zm5 5v6h6V9Z"/></svg>`,
    'multi-path': `<svg ${svgNamespace} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m5 11 4 4 10-10"/><path d="M5 20h14"/></svg>`,
    gradient: `<svg ${svgNamespace} viewBox="0 0 24 24"><defs><linearGradient id="sunrise-${suffix}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f59e0b"/><stop offset="1" stop-color="#db2777"/></linearGradient></defs><circle cx="12" cy="12" r="9" fill="url(#sunrise-${suffix})"/></svg>`,
  };
}

mountLab(
  <>
    <LabSection
      title="Sources by placement"
      description="Each drawing on its own (24px in the reference sheet) and inside Icon at every size."
    >
      <StateMatrix
        axes={{ markup: markups, placement: placements }}
        render={({ markup, placement }) => {
          const source = registry(`${markup}-${placement.replace(' ', '-')}`)[markup] ?? '';
          if (placement === 'standalone') return <SvgMarkup markup={source} />;
          const size = placement.slice('icon '.length) as 'sm' | 'md' | 'lg';
          return (
            <Icon size={size}>
              <SvgMarkup markup={source} />
            </Icon>
          );
        }}
      />
    </LabSection>
    <LabSection
      title="Accessibility"
      description="Decorative by default. Standalone drawings take a label; inside Icon, the Icon is labelled."
    >
      <StateMatrix
        axes={{ naming: ['decorative', 'labelled'], placement: ['standalone', 'icon'] }}
        render={({ naming, placement }) => {
          const source = registry(`a11y-${naming}-${placement}`).outline ?? '';
          const label = naming === 'labelled' ? 'Add city' : undefined;
          return placement === 'standalone' ? (
            <SvgMarkup markup={source} label={label} />
          ) : (
            <Icon label={label}>
              <SvgMarkup markup={source} />
            </Icon>
          );
        }}
      />
    </LabSection>
    <LabSection
      title="Unsafe and missing markup"
      description="Scripts, event handlers and script links are dropped; markup without a drawing renders nothing."
    >
      <p data-lab-unsafe="">
        Sanitised: <SvgMarkup markup={unsafeMarkup} label="Sanitised square" />
      </p>
      <p data-lab-missing="">
        Missing: <SvgMarkup markup="" />
        (nothing)
      </p>
    </LabSection>
  </>,
);
