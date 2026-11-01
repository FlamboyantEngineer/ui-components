import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  MediaViewer,
  type MediaViewerItem,
} from '../../src/components/media-viewer/media-viewer.js';
import { LabOutput } from './lab-output.js';

/** A served image: each query names another request for the same file. */
const landscape = (query: string) => `build/samples/landscape.svg?${query}`;

/** A hundred photos, each with its own URL and no thumbnail of its own. */
export const largeSet: MediaViewerItem[] = Array.from({ length: 100 }, (_, index) => ({
  id: `photo-${index + 1}`,
  src: landscape(`photo=${index + 1}`),
  name: `Photo ${index + 1}.svg`,
  type: 'image/svg+xml',
}));

/** Opens the hundred photos: only the shown photo and the thumbnails near the strip's view load. */
export function LargeSet() {
  const [isOpen, setOpen] = useState(false);
  return (
    <>
      <Button onPress={() => setOpen(true)} data-lab-open="large">
        Open 100 photos
      </Button>
      <MediaViewer items={largeSet} isOpen={isOpen} onOpenChange={setOpen} />
    </>
  );
}

/**
 * An expired link and a missing file. The host answers the first failure of the expired link with a
 * fresh URL; the missing file fails each time Retry asks for it again.
 */
export function FailingImages() {
  const [isOpen, setOpen] = useState(false);
  const [refreshed, setRefreshed] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const items: MediaViewerItem[] = [
    {
      id: 'expired',
      src: refreshed ? landscape('signed=fresh') : 'build/samples/expired-link.svg',
      name: 'Expired link.svg',
      type: 'image/svg+xml',
    },
    { id: 'missing', src: 'build/samples/missing.svg', name: 'Missing.svg', type: 'image/svg+xml' },
  ];
  return (
    <>
      <Button onPress={() => setOpen(true)} data-lab-open="failing">
        Open failing images
      </Button>
      <MediaViewer
        items={items}
        isOpen={isOpen}
        onOpenChange={setOpen}
        onImageError={(item) => {
          setErrors((list) => [...list, item.name]);
          if (item.id === 'expired') setRefreshed(true);
        }}
      />
      <LabOutput name="image-errors">{errors.join(', ') || 'none'}</LabOutput>
    </>
  );
}

const notes: MediaViewerItem[] = ['Agenda', 'Minutes', 'Follow-ups'].map((name, index) => ({
  id: index + 1,
  src: `notes-${index + 1}.txt`,
  name: `${name}.txt`,
  type: 'text/plain',
}));

/** A draft the caller keeps for one file, started from its name. */
function NoteDraft({ item }: { item: MediaViewerItem }) {
  const [draft, setDraft] = useState(`Notes for ${item.name}`);
  return (
    <div>
      <textarea
        aria-label={`Draft for ${item.name}`}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
      <Button onPress={() => setDraft('')}>Clear the draft for {item.name}</Button>
    </div>
  );
}

/** Text files the caller renders as drafts: each file keeps a draft of its own. */
export function NoteDrafts() {
  const [isOpen, setOpen] = useState(false);
  return (
    <>
      <Button onPress={() => setOpen(true)} data-lab-open="drafts">
        Open drafts
      </Button>
      <MediaViewer
        items={notes}
        isOpen={isOpen}
        onOpenChange={setOpen}
        renderItem={(item) => <NoteDraft item={item} />}
      />
    </>
  );
}

/** An uncontrolled viewer that opens on mount, over a list the page refreshes. */
export function RefreshingList() {
  const [isMounted, setMounted] = useState(false);
  const [items, setItems] = useState<MediaViewerItem[]>(largeSet.slice(0, 3));
  const refresh = () => {
    setItems([]);
    setTimeout(() => setItems(largeSet.slice(0, 3)), 300);
  };
  return (
    <>
      <Button onPress={() => setMounted(true)} data-lab-open="refreshing">
        Show viewer opened on mount
      </Button>
      <Button onPress={refresh} data-lab-refresh="refreshing">
        Refresh the list
      </Button>
      <LabOutput name="refreshing-count">{items.length}</LabOutput>
      {isMounted ? <MediaViewer items={items} defaultOpen /> : null}
    </>
  );
}

/**
 * A viewer opened before its items load, which then reverse: the first item shown stays shown, and
 * no selection is reported.
 */
export function ArrivingItems() {
  const [isMounted, setMounted] = useState(false);
  const [items, setItems] = useState<MediaViewerItem[]>([]);
  const [reported, setReported] = useState(0);
  const open = () => {
    setItems([]);
    setMounted(true);
    setTimeout(() => setItems(largeSet.slice(0, 3)), 300);
    setTimeout(() => setItems(largeSet.slice(0, 3).reverse()), 1200);
  };
  return (
    <>
      <Button onPress={open} data-lab-open="arriving">
        Open, then load and reverse the items
      </Button>
      <LabOutput name="arriving-selections">{reported}</LabOutput>
      {isMounted ? (
        <MediaViewer
          items={items}
          defaultOpen
          onOpenChange={setMounted}
          onSelectionChange={() => setReported((count) => count + 1)}
        />
      ) : null}
    </>
  );
}
