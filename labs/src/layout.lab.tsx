import type { CSSProperties, ReactNode } from 'react';
import {
  AspectRatio,
  Contents,
  EmbeddedFrame,
  GridItem,
  type GridItemOffset,
  type GridItemSpan,
  InlineContents,
  ToolbarRow,
  ToolbarRowGroup,
  ToolbarRowSeparator,
} from '../../src/components/layout/index.js';
import {
  Cluster,
  FlexRow,
  Grid,
  type GridColumns,
  InlineField,
  type LayoutGrow,
  Page,
  Stack,
  StatusBar,
  View,
} from '../../src/components/layout/layout.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import {
  AttachedGroups,
  PendingToolbar,
  PresentationChanges,
  ToolbarEdgeFades,
  ToolbarOverflow,
} from './toolbar-row-cases.js';

const spaces = ['none', '3xs', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const;

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

const orchardDocument =
  "<!doctype html><html lang='en'><title>Orchard map</title>" +
  "<main aria-label='Orchard map'><h1 style='font: 14px sans-serif'>Orchard map</h1></main></html>";

const growValues: Record<string, LayoutGrow> = {
  false: false,
  true: true,
  auto: 'auto',
  none: 'none',
};

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
      description="Fixed column counts against gaps, then fit columns by minimum width, then cell alignment against the padding inside the grid (gutter)."
    >
      <StateMatrix
        axes={{
          columns: ['1', '2', '3', '4', '6', '12', 'none'],
          space: ['none', 'md', '2xl'],
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
      <StateMatrix
        axes={{ align: ['stretch', 'start', 'center', 'end'], gutter: ['none', 'md', '2xl'] }}
        render={({ align, gutter }) => (
          <div style={frameStyle(300)}>
            <Grid columns={3} space="xs" align={align} gutter={gutter} data-lab-grid="aligned">
              <Box tall>Tall</Box>
              <Box>Short</Box>
              <Box>Short</Box>
            </Grid>
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Semantic elements"
      description="as renders each primitive as a semantic element with its native props: a named section stack, a navigation cluster of links, a list grid of list items and a description list."
    >
      <Stack
        as="section"
        aria-labelledby="lab-harvest-title"
        space="md"
        data-lab-semantic="section"
      >
        <h3 id="lab-harvest-title">Harvest plan</h3>
        <Cluster as="nav" aria-label="Harvest pages" space="sm" data-lab-semantic="nav">
          <a href="#lab-apples">Apples</a>
          <a href="#lab-pears">Pears</a>
        </Cluster>
        <Grid as="ul" columns={3} space="xs" data-lab-semantic="list">
          <GridItem as="li">
            <Box>Rows 1 to 4</Box>
          </GridItem>
          <GridItem as="li" span={2}>
            <Box>Rows 5 to 12</Box>
          </GridItem>
        </Grid>
        <Grid as="dl" columns={2} space="xs" data-lab-semantic="terms">
          <GridItem as="dt">Picked</GridItem>
          <GridItem as="dd">120 kg</GridItem>
        </Grid>
      </Stack>
    </LabSection>
    <LabSection
      title="Grid items"
      description="A cell's span against its offset in a 12-column grid 360px wide, followed by single-column cells."
    >
      <StateMatrix
        axes={{ span: ['2', '4', '6', 'full'], offset: ['0', '3', '6'] }}
        render={({ span, offset }) => (
          <div style={frameStyle(360)}>
            <Grid columns={12} space="xs">
              <GridItem
                span={(span === 'full' ? 'full' : Number(span)) as GridItemSpan}
                offset={Number(offset) as GridItemOffset}
                data-lab-item="sized"
              >
                <Box>Wide</Box>
              </GridItem>
              <GridItem>
                <Box>1</Box>
              </GridItem>
              <GridItem>
                <Box>2</Box>
              </GridItem>
            </Grid>
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Dividers"
      description="Divided stacks and clusters at three gaps; the dividers are decorative."
    >
      <StateMatrix
        axes={{ primitive: ['stack', 'cluster'], space: ['xs', 'md', '2xl'] }}
        render={({ primitive, space }) => (
          <div style={frameStyle(240)}>
            {primitive === 'stack' ? (
              <Stack divided space={space}>
                {boxes(3)}
              </Stack>
            ) : (
              <Cluster divided space={space}>
                {boxes(3)}
              </Cluster>
            )}
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Aspect ratio"
      description="Each proportion in a 120px wide host, holding a picture that covers the box."
    >
      <StateMatrix
        axes={{ ratio: ['1-1', '4-3', '3-2', '16-9', '21-9', '3-4', '2-3', '9-16'] as const }}
        render={({ ratio }) => (
          <div style={frameStyle(120)}>
            <AspectRatio ratio={ratio}>
              <svg viewBox="0 0 40 40" role="img" aria-label={`Orchard, ${ratio}`}>
                <rect width="40" height="40" fill="currentColor" opacity="0.15" />
                <circle cx="20" cy="20" r="10" fill="currentColor" opacity="0.4" />
              </svg>
            </AspectRatio>
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Page"
      description="Widths against gutters in a 320px host, then each width across the lab."
    >
      <StateMatrix
        axes={{ width: ['full', 'wide', 'reading', 'narrow'], gutter: ['none', 'md', '3xl'] }}
        render={({ gutter, width }) => (
          <div style={frameStyle(320)}>
            <Page width={width} gutter={gutter}>
              <Box>Lorem ipsum</Box>
            </Page>
          </div>
        )}
      />
      <Stack space="md">
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
      description="A caption and its control on one row, as a block or inline, wrapping or not, in a 200px host; then the gap, cross-axis alignment against a two-line control, and distribution."
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
      <StateMatrix
        axes={{
          space: ['xs', 'md', 'xl'],
          align: ['center', 'start', 'end', 'baseline'],
          justify: ['start', 'between', 'end'],
        }}
        render={({ space, align, justify }) => (
          <div style={frameStyle(260)}>
            <InlineField space={space} align={align} justify={justify} data-lab-inline="options">
              <span>Pears</span>
              <textarea rows={2} cols={8} defaultValue="12" aria-label="Pears" />
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
        axes={{ role: ['toolbar', 'group', 'none'], variant: ['plain', 'surface'] }}
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
    <LabSection
      title="Toolbar orientation and groups"
      description="Horizontal and vertical rows of named groups split by separators. A vertical toolbar moves focus with Up and Down."
    >
      <StateMatrix
        axes={{ orientation: ['horizontal', 'vertical'], role: ['toolbar', 'group'] }}
        render={({ orientation, role }) => (
          <div style={frameStyle(orientation === 'vertical' ? 120 : 340)}>
            <ToolbarRow
              role={role}
              orientation={orientation}
              justify="start"
              aria-label={`Kitchen tools ${orientation} ${role}`}
            >
              <ToolbarRowGroup aria-label={`Knives ${orientation} ${role}`}>
                <button type="button">Peel</button>
                <button type="button">Slice</button>
              </ToolbarRowGroup>
              <ToolbarRowSeparator />
              <ToolbarRowGroup aria-label={`Machines ${orientation} ${role}`}>
                <button type="button">Juice</button>
              </ToolbarRowGroup>
            </ToolbarRow>
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Toolbar overflow"
      description="In a 240px host: wrap flows the tools and their groups onto more rows, scroll keeps one row that scrolls between edge buttons, none keeps one row and leaves overflow to the caller."
    >
      <ToolbarOverflow />
    </LabSection>
    <LabSection
      title="Toolbar edge fades"
      description="Edge fades are opt-in: without showEdgeFades a scrolling row draws only its chevrons, on the canvas; with it, a fade covers each edge that hides tools, under the chevron."
    >
      <ToolbarEdgeFades />
    </LabSection>
    <LabSection
      title="Presentation changes keep drafts"
      description="Type in the notes and the search, then toggle the dividers, cycle the toolbar's overflow or turn it vertical: the drafts and the focus stay, since only the presentation changes."
    >
      <PresentationChanges />
    </LabSection>
    <LabSection
      title="Attached toolbar groups"
      description="An attached group joins its tools into one segmented run; each tool stays a toolbar stop."
    >
      <AttachedGroups />
    </LabSection>
    <LabSection
      title="Pending toolbar"
      description="While the editor starts, the row keeps its place but is not painted and its tools are inert, so the text below never moves."
    >
      <PendingToolbar />
    </LabSection>
    <LabSection
      title="Status bar"
      description="Distribution against wrapping in a 260px host, then the gap between items at each space."
    >
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
      <StateMatrix
        axes={{ space: ['none', 'xs', 'md', 'xl'] }}
        render={({ space }) => (
          <div style={frameStyle(260)}>
            <StatusBar space={space} justify="start" data-lab-status="spaced">
              <span>128 words</span>
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
              <Cluster space="md" wrap="nowrap">
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
