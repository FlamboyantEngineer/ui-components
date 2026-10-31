'use client';

import { usePersistentState } from '../../core/provider.js';
import type {
  ChatEffortOption,
  ChatModelOption,
  ChatModelPickerProps,
} from './chat-model-picker.js';
import { createJsonCodec } from '../../utils/json-codec.js';

/** The choices a `persistKey` keeps: each one the caller does not control. */
interface StoredChoice {
  model?: string | undefined;
  effort?: string | undefined;
}

/** The current model and effort, the efforts the model takes, and the reader's ways to change them. */
export interface ChatModelChoice {
  /** The current model; undefined without models. */
  model: ChatModelOption | undefined;
  /** The efforts the current model takes, in order; empty when it takes none. */
  efforts: readonly ChatEffortOption[];
  /** The current effort; undefined while the model takes none. */
  effort: ChatEffortOption | undefined;
  /** Chooses an available model, moving the effort to one the model takes. */
  chooseModel: (id: string) => void;
  /** Chooses one of the current model's efforts. */
  chooseEffort: (id: string) => void;
}

const noEfforts: readonly ChatEffortOption[] = [];

function readText(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/** Reads a stored choice, keeping only its text values, so anything else falls back to the defaults. */
const storedChoiceCodec = createJsonCodec((value): StoredChoice => {
  if (typeof value !== 'object' || value === null) throw new TypeError('Not a stored choice');
  const { model, effort } = value as Record<string, unknown>;
  return { model: readText(model), effort: readText(effort) };
});

/** The first candidate that names one of the options. */
function findFirst<T extends { id: string }>(
  options: readonly T[],
  candidates: readonly (string | undefined)[],
): T | undefined {
  for (const id of candidates) {
    const match = options.find((option) => option.id === id);
    if (match) return match;
  }
  return undefined;
}

/** The efforts a model takes, in the listed order: every listed effort unless it names its own. */
function listModelEfforts(
  model: ChatModelOption | undefined,
  efforts: readonly ChatEffortOption[],
): readonly ChatEffortOption[] {
  if (!model) return noEfforts;
  const allowed = model.efforts;
  return allowed === undefined ? efforts : efforts.filter((effort) => allowed.includes(effort.id));
}

/**
 * The controlled model while it is listed; otherwise the first available model among the stored
 * choice and the default, else the first available model, else the first model.
 */
function resolveModel(
  models: readonly ChatModelOption[],
  controlled: string | undefined,
  candidates: readonly (string | undefined)[],
): ChatModelOption | undefined {
  const available = models.filter((model) => !model.isDisabled);
  return (
    findFirst(models, [controlled]) ?? findFirst(available, candidates) ?? available[0] ?? models[0]
  );
}

/**
 * The picker's model and effort, each controlled or held by the picker (in the provider's storage
 * under `persistKey`). The effort shown is the first of the controlled, held and default efforts
 * the model takes, else the model's default effort, else its first. Choosing a model that does not
 * take the current effort moves it to the model's default effort, or its first, and reports it.
 */
export function useChatModelChoice(props: ChatModelPickerProps): ChatModelChoice {
  const { models, efforts = noEfforts, onModelChange, onEffortChange } = props;
  const [stored, setStored] = usePersistentState<StoredChoice>(
    props.persistKey,
    {},
    { codec: storedChoiceCodec },
  );
  const model = resolveModel(models, props.model, [stored.model, props.defaultModel]);
  const modelEfforts = listModelEfforts(model, efforts);
  const held = props.effort ?? stored.effort ?? props.defaultEffort;
  const effort =
    findFirst(modelEfforts, [
      props.effort,
      stored.effort,
      props.defaultEffort,
      model?.defaultEffort,
    ]) ?? modelEfforts[0];
  const current = effort?.id ?? held;
  const store = (patch: StoredChoice) => setStored((choice) => ({ ...choice, ...patch }));
  const setEffort = (id: string) => {
    if (props.effort === undefined) store({ effort: id });
    if (id !== current) onEffortChange?.(id);
  };
  return {
    model,
    efforts: modelEfforts,
    effort,
    chooseModel(id) {
      const next = models.find((entry) => entry.id === id);
      if (!next || next.isDisabled || id === model?.id) return;
      if (props.model === undefined) store({ model: id });
      onModelChange?.(id);
      const nextEfforts = listModelEfforts(next, efforts);
      const kept = findFirst(nextEfforts, [current, next.defaultEffort]) ?? nextEfforts[0];
      if (kept) setEffort(kept.id);
    },
    chooseEffort(id) {
      if (modelEfforts.some((entry) => entry.id === id)) setEffort(id);
    },
  };
}
