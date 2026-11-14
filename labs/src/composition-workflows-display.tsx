import { useId, useState } from 'react';
import { Avatar } from '../../src/components/avatar/avatar.js';
import { Badge } from '../../src/components/badge/badge.js';
import { Breadcrumb } from '../../src/components/breadcrumb/breadcrumb.js';
import { Button } from '../../src/components/button/button.js';
import { Card } from '../../src/components/card/card.js';
import { CopyButton } from '../../src/components/copy-button/copy-button.js';
import {
  DescriptionList,
  DescriptionRow,
} from '../../src/components/description-list/description-list.js';
import { InlineEdit } from '../../src/components/inline-edit/inline-edit.js';
import { Label } from '../../src/components/label/label.js';
import { Cluster, Grid, Page, Stack, StatusBar } from '../../src/components/layout/layout.js';
import { Link } from '../../src/components/link/link.js';
import { ScrollRegion } from '../../src/components/scroll-region/scroll-region.js';
import { SectionHeader } from '../../src/components/section-header/section-header.js';
import { TruncationTooltip } from '../../src/components/tooltip/index.js';
import { formatPath } from '../../src/utils/path.js';

export function IdentityComposition() {
  return (
    <Cluster space="sm">
      <Link href="#item">
        <Label label="ITEM-12 · Sample item" truncate />
      </Link>
      <Badge>Version 2</Badge>
      <Badge tone="info">Available</Badge>
      <Button aria-label="Remove Sample item" size="sm">
        Remove
      </Button>
    </Cluster>
  );
}

export function HeaderComposition() {
  const [title, setTitle] = useState('Sample item');
  return (
    <Stack space="md">
      <SectionHeader
        title={<InlineEdit label="Item title" value={title} onSave={setTitle} />}
        description="A short description of the item."
        actions={<Button>Edit</Button>}
      />
      <Cluster justify="between">
        <Cluster>
          <IdentityComposition />
          <CopyButton value="ITEM-12" label="Copy item identifier" />
        </Cluster>
        <Badge tone="info">Available</Badge>
      </Cluster>
    </Stack>
  );
}

export function PersonComposition() {
  return (
    <Card
      title="Alex Morgan"
      description="Design team"
      leading={<Avatar name="Alex Morgan" />}
      presentationSteps={{ compact: { width: 360 }, minimal: { width: 180 } }}
    >
      <Stack space="sm">
        <DescriptionList>
          <DescriptionRow label="Team">Design</DescriptionRow>
          <DescriptionRow label="Location">Remote</DescriptionRow>
        </DescriptionList>
        <Link href="mailto:alex@example.com">alex@example.com</Link>
        <Badge tone="success">Available</Badge>
        <Button>Message Alex</Button>
      </Stack>
    </Card>
  );
}

export function MetricComposition() {
  return (
    <Card title="Visitors">
      <Stack space="sm">
        <strong>1,284</strong>
        <Label label="12% increase from the previous period" />
        <Badge tone="success">Above target</Badge>
      </Stack>
    </Card>
  );
}

export function HistoryComposition() {
  return (
    <Stack as="ol" space="lg" aria-label="Item history">
      <Stack as="li" space="sm">
        <Cluster>
          <Badge>Created</Badge>
          <time dateTime="2026-05-12">12 May 2026</time>
          <Label label="Alex Morgan" />
        </Cluster>
        <p>Initial version.</p>
      </Stack>
      <Stack as="li" space="sm" aria-current="step">
        <Cluster>
          <Badge tone="success">Available</Badge>
          <Label label="Current" />
        </Cluster>
        <p>The latest version is available.</p>
      </Stack>
      <Stack as="li" space="sm">
        <Badge>Archived · Upcoming</Badge>
      </Stack>
    </Stack>
  );
}

export function LocationComposition() {
  return (
    <Stack space="sm">
      <Breadcrumb
        aria-label="Item location"
        overflow="menu"
        items={[
          { label: 'Library', href: '#library' },
          { label: 'Examples', href: '#examples' },
          { label: 'Sample item' },
        ]}
      />
      <TruncationTooltip dir="rtl" tabIndex={0}>
        <bdi dir="ltr">{formatPath(['Library', 'Examples', 'Sample item'])}</bdi>
      </TruncationTooltip>
    </Stack>
  );
}

export function FrameComposition({
  contentElement = 'section',
}: { contentElement?: 'main' | 'section' } = {}) {
  const mainId = useId();
  return (
    <Stack space="md">
      <Link href={`#${mainId}`}>Skip to sample content</Link>
      <Cluster as="header" justify="between">
        <Label label="Workspace" />
        <Button>Settings</Button>
      </Cluster>
      <Grid columns="fit" minColumnWidth="sm">
        <Stack as="nav" aria-label="Sample navigation" space="sm">
          <Link href={`#${mainId}`}>Overview</Link>
          <Link href="#details">Details</Link>
        </Stack>
        <ScrollRegion role="region" aria-label="Scrollable sample content" grow>
          <Page gutter="md">
            <Stack as={contentElement} id={mainId} tabIndex={-1} aria-label="Sample content">
              <SectionHeader title="Overview" />
              <p>The host owns navigation and the regions around this content.</p>
            </Stack>
          </Page>
        </ScrollRegion>
        <Card title="Details">
          <p>Supporting information</p>
        </Card>
      </Grid>
      <StatusBar aria-label="Sample status">
        <Label label="All changes saved" />
      </StatusBar>
    </Stack>
  );
}
