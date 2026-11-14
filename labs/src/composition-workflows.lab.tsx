import { LabSection, mountLab } from './chrome/index.js';
import {
  DecisionComposition,
  ReviewComposition,
  SigningComposition,
  TransitionComposition,
} from './composition-workflows-actions.js';
import {
  FrameComposition,
  HeaderComposition,
  HistoryComposition,
  IdentityComposition,
  LocationComposition,
  MetricComposition,
  PersonComposition,
} from './composition-workflows-display.js';
import { FilterComposition, SelectionComposition } from './composition-workflows-filters.js';

mountLab(
  <>
    <LabSection title="Counted filters">
      <FilterComposition />
    </LabSection>
    <LabSection title="Selected items">
      <SelectionComposition />
    </LabSection>
    <LabSection title="Header">
      <HeaderComposition />
    </LabSection>
    <LabSection title="Identity">
      <IdentityComposition />
    </LabSection>
    <LabSection title="Person">
      <PersonComposition />
    </LabSection>
    <LabSection title="Metric">
      <MetricComposition />
    </LabSection>
    <LabSection title="History">
      <HistoryComposition />
    </LabSection>
    <LabSection title="Location">
      <LocationComposition />
    </LabSection>
    <LabSection title="Frame">
      <FrameComposition />
    </LabSection>
    <LabSection title="Change availability">
      <TransitionComposition />
    </LabSection>
    <LabSection title="Review">
      <ReviewComposition />
    </LabSection>
    <LabSection title="Response">
      <DecisionComposition />
    </LabSection>
    <LabSection title="Signing">
      <SigningComposition />
    </LabSection>
  </>,
);
