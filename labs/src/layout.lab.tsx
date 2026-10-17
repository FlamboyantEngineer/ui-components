import type { CSSProperties, ReactNode } from 'react';
import {
  Cluster,
  Contents,
  EmbeddedFrame,
  FlexRow,
  Grid,
  InlineContents,
  InlineField,
  Page,
  Stack,
  StatusBar,
  View,
  type GridColumns,
  type LayoutGrow,
} from '../../src/components/layout/layout.js';
import { ToolbarRow } from '../../src/components/layout/toolbar-row.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const spaces = [
  'none',
  '3xs',
  '2xs',
  'xs',
  'compact',
  'sm',
  'sm-plus',
  'relaxed',
  'md',
  'lg',
] as const;
const fruit = ['Apple', 'Banana', 'Cherry', 'Damson', 'Elderberry', 'Fig', 'Grape', 'Huckleberry'];

// Lab-only outlines so the arrangement is visible with or without a stylesheet.
const boxStyle: CSSProperties = {
  display: 'inline-block',
  padding: '2px 6px',
  border: '1px dashed currentColor',
  borderRadius: 4,
  whiteSpace: 'nowrap',
};
const frameStyle = (width: number | string, height?: number): CSSProperties => ({
  width,
  height,
  outline: '1px dotted currentColor',
});

function Box({ children, tall }: { children: ReactNode; tall?: boolean }) {
  return (
    <span data-lab-box="" style={tall ? { ...boxStyle, paddingBlock: 12 } : boxStyle}>
      {children}
    </span>
  );
}

function boxes(count: number) {
  return fruit.slice(0, count).map((name, index) => (
    <Box key={name} tall={index === 1}>
      {name}
    </Box>
  ));
}

const orchardDocument =
  "<!doctype html><html lang='en'><title>Orchard map</title>" +
  "<main aria-label='Orchard map'><h1 style='font: 14px sans-serif'>Orchard map</h1></main></html>";

const growValues: Record<string, LayoutGrow> = {
  false: false,
  true: true,
  auto: 'auto',
  none: 'none',
};

mountLab(
  <>
    <LabSection
      title="Stack"
      description="Every spacing step against every cross-axis alignment, in a 160px column."
    >
      <StateMatrix
        axes={{ space: spaces, align: ['start', 'center', 'end', 'stretch', 'baseline'] }}
        render={({ space, align }) => (
          <div style={frameStyle(160)}>
            <Stack space={space} align={align}>
              {boxes(3)}
            </Stack>
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Cluster"
      description="Distribution against wrapping in a 240px row, then alignment against inline flow."
    >
      <StateMatrix
        axes={{
          justify: ['normal', 'start', 'center', 'end', 'between'],
          wrap: ['wrap', 'nowrap'],
        }}
        render={({ justify, wrap }) => (
          <div style={{ ...frameStyle(240), overflow: 'hidden' }}>
            <Cluster justify={justify} wrap={wrap}>
              {boxes(justify === 'between' ? 3 : 5)}
            </Cluster>
          </div>
        )}
      />
      <StateMatrix
        axes={{
          align: ['start', 'center', 'end', 'stretch', 'baseline'],
          flow: ['block', 'inline'],
        }}
        render={({ align, flow }) => (
          <div style={frameStyle(240)}>
            Before{' '}
            <Cluster align={align} inline={flow === 'inline'} space="xs">
              {boxes(3)}
            </Cluster>{' '}
            after
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Grid"
      description="Fixed column counts against gaps, then fit columns by minimum width."
    >
      <StateMatrix
        axes={{
          columns: ['1', '2', '3', '4', '6', '12', 'none'],
          space: ['none', 'sm', 'md'],
        }}
        render={({ columns, space }) => (
          <div style={frameStyle(300)}>
            <Grid
              columns={(columns === 'none' ? 'none' : Number(columns)) as GridColumns}
              space={space}
            >
              {boxes(6)}
            </Grid>
          </div>
        )}
      />
      <StateMatrix
        axes={{ minColumnWidth: ['sm', 'md', 'lg', 'xl'], width: ['360', '720'] }}
        render={({ minColumnWidth, width }) => (
          <div style={frameStyle(Number(width))}>
            <Grid columns="fit" minColumnWidth={minColumnWidth}>
              {boxes(6)}
            </Grid>
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Page"
      description="Widths against gutters in a 320px host, then each width across the lab."
    >
      <StateMatrix
        axes={{ width: ['full', 'wide', 'reading', 'narrow'], gutter: ['none', 'sm', 'lg'] }}
        render={({ gutter, width }) => (
          <div style={frameStyle(320)}>
            <Page width={width} gutter={gutter}>
              <Box>Lorem ipsum</Box>
            </Page>
          </div>
        )}
      />
      <Stack space="sm">
        {(['full', 'wide', 'reading', 'narrow'] as const).map((width) => (
          <div key={width} style={frameStyle('100%')}>
            <Page width={width} gutter="xs" data-lab-page={width}>
              <Box>{width}</Box>
            </Page>
          </div>
        ))}
      </Stack>
    </LabSection>
    <LabSection
      title="Containment"
      description="Growth of the first item in a 400px flex row beside a fixed item, then a bottom-aligned cluster that fills and clips a 56px tall host."
    >
      <StateMatrix
        axes={{ grow: ['false', 'true', 'auto', 'none'], host: ['400px row'] }}
        render={({ grow }) => (
          <div style={frameStyle(400)}>
            <FlexRow>
              <Stack grow={growValues[grow]} align="start">
                <Box>Grows</Box>
              </Stack>
              <Box>Fixed</Box>
            </FlexRow>
          </div>
        )}
      />
      <StateMatrix
        axes={{ fill: ['off', 'on'], clip: ['off', 'on'] }}
        render={({ fill, clip }) => (
          <div style={{ ...frameStyle(200, 56), marginBottom: 40 }}>
            <Cluster fill={fill === 'on'} clip={clip === 'on'} align="end" space="xs">
              {boxes(5)}
            </Cluster>
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Inline field"
      description="A caption and its control on one row, as a block or inline, wrapping or not, in a 200px host."
    >
      <StateMatrix
        axes={{ flow: ['block', 'inline'], wrap: ['nowrap', 'wrap'] }}
        render={({ flow, wrap }) => (
          <div style={frameStyle(200)}>
            <InlineField inline={flow === 'inline'} wrap={wrap}>
              Quantity of pears <input size={6} defaultValue="12" />
            </InlineField>
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Toolbar row"
      description="Roles against variants. The toolbar role moves focus with the arrow keys."
    >
      <StateMatrix
        axes={{ role: ['toolbar', 'group', 'none'], variant: ['plain', 'band'] }}
        render={({ role, variant }) => (
          <div style={frameStyle(300)}>
            <ToolbarRow
              role={role}
              variant={variant}
              {...(role === 'none' ? {} : { 'aria-label': `Fruit actions ${role} ${variant}` })}
            >
              <button type="button">Peel</button>
              <button type="button">Slice</button>
              <button type="button">Juice</button>
            </ToolbarRow>
          </div>
        )}
      />
    </LabSection>
    <LabSection title="Status bar" description="Distribution against wrapping in a 260px host.">
      <StateMatrix
        axes={{ justify: ['between', 'start', 'end'], wrap: ['nowrap', 'wrap'] }}
        render={({ justify, wrap }) => (
          <div style={frameStyle(260)}>
            <StatusBar justify={justify} wrap={wrap}>
              <span>128 words</span>
              <span>Saved just now</span>
              <span>English</span>
            </StatusBar>
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Wrappers"
      description="Transparent wrappers inside a flex row or text, shown and hidden, and a view holding an embedded frame."
    >
      <StateMatrix
        axes={{ wrapper: ['contents', 'inline contents'], state: ['shown', 'hidden'] }}
        render={({ wrapper, state }) => (
          <div style={frameStyle(300)}>
            {wrapper === 'contents' ? (
              <Cluster space="sm" wrap="nowrap">
                <Box>Outside</Box>
                <Contents hidden={state === 'hidden'}>
                  <Box>Inside one</Box>
                  <Box>Inside two</Box>
                </Contents>
              </Cluster>
            ) : (
              <p>
                Plain text with{' '}
                <InlineContents hidden={state === 'hidden'}>
                  <strong>wrapped words</strong>
                </InlineContents>{' '}
                inside.
              </p>
            )}
          </div>
        )}
      />
      <div
        data-lab-view-host=""
        style={{ ...frameStyle(320, 160), display: 'flex', flexDirection: 'column' }}
      >
        <View>
          <EmbeddedFrame
            title="Map of the orchard"
            sandbox="allow-scripts"
            srcDoc={orchardDocument}
          />
        </View>
      </div>
    </LabSection>
  </>,
);
