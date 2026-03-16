// lib/crussader-assistant/memory/mergeIntakeMemoryState.ts

import { intakeCatalog } from "../intake/intakeCatalog";
import type {
  IntakeMemoryState,
  IntakeTranslatorResult,
  PendingTask
} from "../intake/intakeTypes";
import type { IntakeCapabilityKey } from "../intake/intakeCatalog";

type MergeIntakeMemoryStateArgs = {
  currentState: IntakeMemoryState;
  translatorResult: IntakeTranslatorResult;
};

function getCapabilityDefinition(capabilityKey: IntakeCapabilityKey | null) {
  if (!capabilityKey) {
    return null;
  }

  return (
    intakeCatalog.capabilities.find(
      (capability) => capability.key === capabilityKey
    ) || null
  );
}

function normalizeMissingFields(
  capabilityKey: IntakeCapabilityKey | null,
  collectedData: Record<string, unknown>,
  _aiMissingFields: string[]
) {
  const capability = getCapabilityDefinition(capabilityKey);

  if (!capability) {
    return [];
  }

  const requiredMissing: string[] = [];

  for (const field of capability.requiredFields) {

    const value = collectedData[field];

    if (typeof value === "string") {
      if (!value.trim()) {
        requiredMissing.push(field);
      }
      continue;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        requiredMissing.push(field);
      }
      continue;
    }

    if (value === null || value === undefined) {
      requiredMissing.push(field);
    }
  }

  return requiredMissing;
}

function asCapabilityKey(value: unknown): IntakeCapabilityKey | null {
  if (typeof value !== "string") {
    return null;
  }

  const exists = intakeCatalog.capabilities.some(
    (capability) => capability.key === value
  );

  if (!exists) {
    return null;
  }

  return value as IntakeCapabilityKey;
}

function buildPendingTask(args: {
  capability: IntakeCapabilityKey | null;
  collectedData: Record<string, unknown>;
  missingFields: string[];
  userGoal: string | null;
}): PendingTask | null {
  if (!args.capability) {
    return null;
  }

  return {
    capability: args.capability,
    status: args.missingFields.length > 0 ? "COLLECTING" : "READY",
    collectedData: args.collectedData,
    missingFields: args.missingFields,
    userGoal: args.userGoal
  };
}

export function mergeIntakeMemoryState(
  args: MergeIntakeMemoryStateArgs
): IntakeMemoryState {
  const { currentState, translatorResult } = args;

  const currentPendingTask = currentState.pendingTask;
  const mode = translatorResult.interactionMode;

  if (mode === "CONVERSATION" || mode === "UNCLEAR") {
    return {
      ...currentState,
      pendingTask: currentPendingTask
    };
  }

  if (mode === "TASK_DETECTED") {
    const capability = asCapabilityKey(translatorResult.detectedCapability);
    const collectedData = { ...translatorResult.data };
    const missingFields = normalizeMissingFields(
      capability,
      collectedData,
      translatorResult.missingFields
    );

    return {
      ...currentState,
      pendingTask: buildPendingTask({
        capability,
        collectedData,
        missingFields,
        userGoal: translatorResult.userGoal
      })
    };
  }

  if (mode === "TASK_DATA_CONTINUATION") {
    const fallbackCapability =
      currentPendingTask?.capability ||
      asCapabilityKey(translatorResult.detectedCapability);

    const baseCollectedData = currentPendingTask?.collectedData || {};
    const collectedData = {
      ...baseCollectedData,
      ...translatorResult.data
    };

    const missingFields = normalizeMissingFields(
      fallbackCapability,
      collectedData,
      translatorResult.missingFields
    );

    const userGoal =
      currentPendingTask?.userGoal || translatorResult.userGoal || null;

    console.log("[merge][previousPendingTask]", currentPendingTask);
    console.log("[merge][translatorData]", translatorResult.data);
    console.log("[merge][mergedCollectedData]", collectedData);
    console.log("[merge][translatorMissingFields]", translatorResult.missingFields);
    console.log("[merge][finalMissingFields]", missingFields);

    return {
      ...currentState,
      pendingTask: buildPendingTask({
        capability: fallbackCapability,
        collectedData,
        missingFields,
        userGoal
      })
    };
  }

  if (mode === "TASK_CONFIRM") {

  const pending = currentPendingTask;

  if (!pending) {
    return currentState;
  }

  return {
    ...currentState,
    pendingTask: {
      ...pending,
      status: "READY"
    }
  };
}

  return currentState;
}