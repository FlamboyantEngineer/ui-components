import type { CSSProperties, ReactNode } from 'react';
import { Button } from '../../src/components/button/button.js';
import { ToolbarRow, ToolbarRowSeparator } from '../../src/components/layout/index.js';
import { Menu, MenuItem, MenuSeparator } from '../../src/components/menu/menu.js';
import { Separator } from '../../src/components/separator/separator.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const variants = ['solid', 'dashed', 'dotted', 'wiggly'] as const;
const positions = ['start', 'center', 'end'] as const;
const placements = ['across', 'before', 'after'] as const;
const orientations = ['horizontal', 'vertical'] as const;

// Lab layout only: a row whose items a vertical separator stands between.
const row: CSSProperties = { display: 'flex', alignItems: 'center', minInlineSize: 160 };
const column: CSSProperties = { inlineSize: 200 };

function Row({ children, height }: { children: ReactNode; height?: number }) {
  return <div style={height ? { ...row, blockSize: height } : row}>{children}</div>;
}

function PlacedSeparator({
  orientation,
  placement,
  position,
  variant,
}: {
  orientation: (typeof orientations)[number];
  placement: (typeof placements)[number];
  position: (typeof positions)[number];
  variant?: (typeof variants)[number];
}) {
  return orientation === 'horizontal' ? (
    <div style={column}>
      <Separator
        label="Desserts"
        labelPlacement={placement}
        labelPosition={position}
        variant={variant}
      />
    </div>
  ) : (
    <Row height={120}>
      <span>Breakfast</span>
      <Separator
        orientation="vertical"
        label="or"
        labelPlacement={placement}
        labelPosition={position}
        variant={variant}
      />
      <span>Brunch</span>
    </Row>
  );
}

function SignInOptions() {
  return (
    <div data-lab-demo="sign-in" style={{ display: 'grid', gap: 4, maxInlineSize: 320 }}>
      <Button variant="primary" fullWidth>
        Continue with email
      </Button>
      <Separator label="or" />
      <Button fullWidth>Continue with a passkey</Button>
    </div>
  );
}

function RecipeCard() {
  return (
    <article data-lab-demo="recipe" style={{ maxInlineSize: 420 }}>
      <h3>Lemon tart</h3>
      <Row>
        <span>Serves 6</span>
        <Separator orientation="vertical" />
        <span>45 min</span>
        <Separator orientation="vertical" />
        <span>Moderate</span>
      </Row>
      <Separator variant="dashed" />
      <p>Blind-bake the pastry, whisk the curd until it coats a spoon, then fill and chill.</p>
      <ul style={{ paddingInlineStart: 0, listStyle: 'none' }}>
        <li>Pastry</li>
        <li>
          <Separator decorative variant="dotted" />
        </li>
        <li>Lemon curd</li>
      </ul>
    </article>
  );
}

function Timeline() {
  return (
    <div data-lab-demo="timeline" style={{ maxInlineSize: 420 }}>
      <Separator label="Today" labelPosition="start" />
      <p>Ordered apples, pears and plums.</p>
      <Separator label="Yesterday" labelPosition="start" />
      <p>Saved the cherry clafoutis recipe.</p>
      <Separator label="End of history" labelPosition="end" variant="dotted" />
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Orientations and line styles"
      description="Horizontal rules span their container; vertical rules stand between the items of a row at its height. A wiggly rule draws a wave along either axis."
    >
      <StateMatrix
        axes={{ orientation: ['horizontal', 'vertical'], variant: variants }}
        render={({ orientation, variant }) =>
          orientation === 'horizontal' ? (
            <div style={column}>
              <span>Apples</span>
              <Separator variant={variant} />
              <span>Pears</span>
            </div>
          ) : (
            <Row>
              <span>Apples</span>
              <Separator orientation="vertical" variant={variant} />
              <span>Pears</span>
            </Row>
          )
        }
      />
    </LabSection>
    <LabSection
      title="Labels"
      description="A label drawn across the line names the separator; a line runs on each side, and the label sits at the start, the centre or the end."
    >
      <StateMatrix
        axes={{ variant: variants, labelPosition: positions }}
        render={({ variant, labelPosition }) => (
          <div style={column}>
            <Separator label="Desserts" labelPosition={labelPosition} variant={variant} />
          </div>
        )}
      />
      <StateMatrix
        axes={{ labelPosition: positions }}
        caption="Vertical labelled separators"
        render={({ labelPosition }) => (
          <Row height={120}>
            <span>Breakfast</span>
            <Separator orientation="vertical" label="or" labelPosition={labelPosition} />
            <span>Brunch</span>
          </Row>
        )}
      />
    </LabSection>
    <LabSection
      title="Label placement"
      description="A label sits across the line, or before or after an unbroken one: above or below a horizontal line, at the inline start or end of a vertical one. Its position still aligns it along the line."
    >
      <StateMatrix
        axes={{ orientation: orientations, placement: placements, align: positions }}
        render={({ orientation, placement, align }) => (
          <PlacedSeparator orientation={orientation} placement={placement} position={align} />
        )}
      />
      <StateMatrix
        axes={{ variant: ['wiggly'], orientation: orientations, placement: placements }}
        caption="Wiggly lines beside their labels"
        render={({ variant, orientation, placement }) => (
          <PlacedSeparator
            orientation={orientation}
            placement={placement}
            position="center"
            variant={variant}
          />
        )}
      />
      <StateMatrix
        axes={{ length: ['short', 'long'], orientation: orientations }}
        caption="Wiggly lines, short and long, without a label"
        render={({ length, orientation }) => {
          const size = length === 'short' ? 30 : 320;
          return orientation === 'horizontal' ? (
            <div style={{ inlineSize: size }}>
              <Separator variant="wiggly" />
            </div>
          ) : (
            <div style={{ ...row, minInlineSize: 0, blockSize: size }}>
              <Separator orientation="vertical" variant="wiggly" />
            </div>
          );
        }}
      />
      <div dir="rtl">
        <StateMatrix
          axes={{ direction: ['rtl'], orientation: orientations, placement: placements }}
          caption="Right to left, aligned to the start"
          render={({ orientation, placement }) => (
            <PlacedSeparator orientation={orientation} placement={placement} position="start" />
          )}
        />
      </div>
    </LabSection>
    <LabSection
      title="Semantics"
      description="A separator, a labelled one, and their decorative versions, which assistive technology passes over while the label stays readable as text."
    >
      <StateMatrix
        axes={{ kind: ['separator', 'decorative'], content: ['plain', 'labelled'] }}
        render={({ kind, content }) => (
          <div style={column}>
            <Separator
              decorative={kind === 'decorative'}
              label={content === 'labelled' ? 'Pastry' : undefined}
            />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Choosing between two actions"
      description="A labelled separator between two sign-in buttons."
    >
      <SignInOptions />
    </LabSection>
    <LabSection
      title="In a card"
      description="Vertical separators between facts, a dashed rule before the method and a decorative dotted rule between list items."
    >
      <RecipeCard />
    </LabSection>
    <LabSection
      title="Grouping a history"
      description="Start-aligned labels head each day; a dotted end-aligned label closes the list."
    >
      <Timeline />
    </LabSection>
    <LabSection
      title="Inside toolbars and menus"
      description="A toolbar row's separator and a menu separator are separators too: they carry the generic hooks and keep the look their own components give them."
    >
      <div data-lab-demo="composed" style={{ display: 'grid', gap: 16, maxInlineSize: 320 }}>
        <ToolbarRow aria-label="Editing" justify="start">
          <Button size="sm">Cut</Button>
          <Button size="sm">Copy</Button>
          <ToolbarRowSeparator />
          <Button size="sm">Undo</Button>
        </ToolbarRow>
        <Menu aria-label="Edit">
          <MenuItem>Cut</MenuItem>
          <MenuItem>Copy</MenuItem>
          <MenuSeparator />
          <MenuItem>Undo</MenuItem>
        </Menu>
      </div>
    </LabSection>
  </>,
);
