import { LabSection, mountLab } from './chrome/index.js';
import {
  FolderCollectionRecipe,
  QueryCollectionRecipe,
  SnippetCollectionRecipe,
} from './composition-collections-editors.js';
import {
  ActivityCollectionRecipe,
  ChangeCollectionRecipe,
  NotificationCollectionRecipe,
  RevisionCollectionRecipe,
} from './composition-collections-feeds.js';
import {
  ConstraintCollectionRecipe,
  DisplayCollectionRecipe,
  MappingCollectionRecipe,
  PermissionCollectionRecipe,
} from './composition-collections-options.js';
import { ViewCollectionRecipe } from './composition-collections-views.js';

mountLab(
  <>
    <LabSection
      title="Activity groups"
      description="Host events grouped in a keyboard-accessible collection."
    >
      <ActivityCollectionRecipe />
    </LabSection>
    <LabSection
      title="Before and after"
      description="Host values laid out with shared spacing and dividers."
    >
      <ChangeCollectionRecipe />
    </LabSection>
    <LabSection
      title="Dismissible updates"
      description="Host removal policy with collection selection and empty state."
    >
      <NotificationCollectionRecipe />
    </LabSection>
    <LabSection
      title="Revision selection"
      description="Select, filter, compare, rename and restore host-owned revisions."
    >
      <RevisionCollectionRecipe />
    </LabSection>
    <LabSection title="Display choices">
      <DisplayCollectionRecipe />
    </LabSection>
    <LabSection
      title="Saved views"
      description="The host owns saved snapshots, unsaved changes and their actions."
    >
      <ViewCollectionRecipe />
    </LabSection>
    <LabSection
      title="Column assignments"
      description="The initial duplicate destinations show host validation."
    >
      <MappingCollectionRecipe />
    </LabSection>
    <LabSection
      title="Permission choices"
      description="An inherited grant remains read-only beside editable choices."
    >
      <PermissionCollectionRecipe />
    </LabSection>
    <LabSection title="Related constraints">
      <ConstraintCollectionRecipe />
    </LabSection>
    <LabSection title="Source selection">
      <SnippetCollectionRecipe />
    </LabSection>
    <LabSection title="Query submission">
      <QueryCollectionRecipe />
    </LabSection>
    <LabSection
      title="Collection management"
      description="Create, select, filter and asynchronously rename a collection."
    >
      <FolderCollectionRecipe />
    </LabSection>
  </>,
);
