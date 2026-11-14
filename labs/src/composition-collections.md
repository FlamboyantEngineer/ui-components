# Collection compositions

All recipes use library controls and the shared reference stylesheet. No recipe supplies gap,
spacing, alignment or responsive CSS. Place the examples in a `Page width="narrow"` or
`Page width="wide"`; wrapping clusters and fit grids adapt to the available width.

| Removed family                        | Copyable recipe              | Generic facilities                                                                 | Host responsibility                                                                                                                          |
| ------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| ActivityFeed                          | ActivityCollectionRecipe     | ListView, ListViewSection, ListViewItem                                            | Group dates, format event text, fetch pages through onLoadMore/isLoading; show InlineError for a failed page                                 |
| ChangeList                            | ChangeCollectionRecipe       | Stack, Cluster, native del/ins                                                     | Compute differences and format values                                                                                                        |
| NotificationCenter / NotificationList | NotificationCollectionRecipe | ListView, Button                                                                   | Read/unread state, dismiss policy, arrivals and announcements                                                                                |
| DisplayOptions                        | DisplayCollectionRecipe      | Checkbox, SelectField, Stack                                                       | Visible fields, sorting and grouping state; feed Table columnLayout/filter/sort                                                              |
| ViewSwitcher                          | ViewCollectionRecipe         | Button, Cluster, Stack                                                             | Saved views, persistence, duplicate/rename/delete policy                                                                                     |
| FolderManager                         | FolderCollectionRecipe       | Tree, SearchField, Modal, TextField, Button                                        | CRUD data, allowed destinations and depth; Tree owns selection, filtering, inline async rename, onLoadChildren retry and reorder interaction |
| VersionHistory                        | RevisionCollectionRecipe     | Tree hierarchy, sections, multiple selection, filter, inline rename, Modal, Button | Revision hierarchy/filtering, comparison ordering, rename/restore callbacks and persistence                                                  |
| MappingTable                          | MappingCollectionRecipe      | Table, SelectField                                                                 | Matching suggestions, duplicates and required-target validation                                                                              |
| PermissionMatrix                      | PermissionCollectionRecipe   | Table, Checkbox                                                                    | Inheritance, grants and authorization policy; use isIndeterminate/isReadOnly for inherited grants                                            |
| ConstraintEditor                      | ConstraintCollectionRecipe   | Grid, NumberField                                                                  | Bounds and compatibility rules, exact-decimal numeric policy                                                                                 |
| SnippetField                          | SnippetCollectionRecipe      | SelectField, CodeEditor, Stack                                                     | Load source, cache, debounce, cancellation and preview evaluation                                                                            |
| QueryField                            | QueryCollectionRecipe        | CodeEditor, Button, Stack                                                          | Query grammar, transport, result data; provide completions/diagnostics to CodeEditor                                                         |

The sample callbacks keep local host state for easy copying. Real hosts supply transport and own
business errors. Modal primary actions await promises, keep failed dialogs open with feedback and
return focus when they close. Tree's inline rename awaits promises, retains the draft on failure,
and lets Enter retry; obsolete requests cannot close a later editing session.

The revision recipe maps host hierarchy to Tree with multiple selection and controlled expansion.
Alternatively, flatten the expanded subset into ListView sections. Filtering and named-version folding remain
small host projections over revision data; neither requires a new library revision schema.
