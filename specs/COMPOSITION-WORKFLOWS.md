# Workflow compositions

Hosts own item state, response policy, credential verification and page regions. The copyable workflow examples use existing controls and the reference stylesheet; their layout needs no additional spacing or alignment rules.

## UIC-COMPOSITION-WORKFLOWS-1 - Recipes

### UIC-COMPOSITION-WORKFLOWS-1.1 - Display compositions

The recipes shall demonstrate header actions with SectionHeader and Cluster; item identities with Label, Link and Badge; people with Avatar and adaptive Card; metrics with Card; history with semantic Stack lists and Badge; locations with Breadcrumb and TruncationTooltip; and named page regions with Stack, Grid, ScrollRegion and StatusBar. They shall remain usable in compact and wide containers. The frame uses a named section when embedded inside an existing main landmark; a standalone host can select main content semantics.

Implementation: `labs/src/composition-workflows-display.tsx`
Verification: `e2e/composition-workflows.spec.ts`, `labs/src/composition-workflows-display.test.tsx`

### UIC-COMPOSITION-WORKFLOWS-1.2 - Host state and decisions

The examples shall keep availability and response state in the host. DropdownMenu, Dialog, ChoiceGroup, TextField and Button shall supply keyboard operation, validation labels and accessible disabled actions. A required explanation prevents confirmation until entered.

Implementation: `labs/src/composition-workflows-actions.tsx`
Verification: `e2e/composition-workflows.spec.ts`, `labs/src/composition-workflows-actions.test.tsx`

### UIC-COMPOSITION-WORKFLOWS-1.3 - Signature and async action

The signing composition shall use SignaturePad and TextField in a Dialog. The generic modal shall keep failed asynchronous actions open with an error, allow retry, prevent duplicate submission while pending, and restore focus to its trigger on completion. Opening a new signing session clears host-owned credentials and signature values.

Implementation: `labs/src/composition-workflows-actions.tsx`
Verification: `e2e/composition-workflows.spec.ts`, `labs/src/composition-workflows-actions.test.tsx`

### UIC-COMPOSITION-WORKFLOWS-1.4 - Counted filters

Hosts shall compose counted SegmentedChoice filters and ActionRow commands without custom spacing rules. Scrollable intrinsic lead content keeps icon-free multiword labels and counts available at compact widths while three adjacent icon actions, including pending and menu controls, stay contained. SegmentedChoice supplies pending state, rejection rollback and responsive icon-only presentation; the host owns requests and feedback and can retry a failed change.

Implementation: `labs/src/composition-workflows-filters.tsx`
Verification: `e2e/composition-workflows.spec.ts`

### UIC-COMPOSITION-WORKFLOWS-1.5 - Selection actions

The host shall own count, visibility, clear commands and Escape policy. ActionRow finalFocus restores collection focus when a focused row leaves. Cluster, Stack and Button provide layout without custom spacing or alignment rules.

Implementation: `labs/src/composition-workflows-filters.tsx`
Verification: `e2e/composition-workflows.spec.ts`

### UIC-COMPOSITION-WORKFLOWS-1.6 - Reviewer roster

The review example shall present each reviewer with UserIdentity and Badge, attribution for completed responses, current counts and outcome, and an asynchronous reminder with host-owned failure feedback and retry. The host computes its required response count and outcome.

Implementation: `labs/src/composition-workflows-actions.tsx`
Verification: `e2e/composition-workflows.spec.ts`
