// lib/crussader-assistant/intake/buildIntakePacket.ts
import {
  BuildIntakePacketInput,
  IntakeEntities,
  IntakeMemoryUsage,
  IntakePacket,
  IntakeRoutingSuggestion
} from "./types";

function buildDefaultEntities(): IntakeEntities {
  return {
    rawDateExpressions: [],
    rawTimeExpressions: [],
    rawRecurrenceExpressions: [],
    rawTopics: [],
    rawPeople: [],
    rawLocations: []
  };
}

function buildDefaultMemoryUsage(): IntakeMemoryUsage {
  return {
    usedProfileFields: [],
    usedStateFields: [],
    pendingStateDetected: false
  };
}

function buildDefaultRouting(): IntakeRoutingSuggestion {
  return {
    targetModule: null,
    targetAction: null
  };
}

export function buildIntakePacket(input: BuildIntakePacketInput): IntakePacket {
  const entities = buildDefaultEntities();
  const memory = buildDefaultMemoryUsage();
  const routing = buildDefaultRouting();

  if (input.entities) {
    if (input.entities.rawDateExpressions) {
      entities.rawDateExpressions = input.entities.rawDateExpressions;
    }

    if (input.entities.rawTimeExpressions) {
      entities.rawTimeExpressions = input.entities.rawTimeExpressions;
    }

    if (input.entities.rawRecurrenceExpressions) {
      entities.rawRecurrenceExpressions = input.entities.rawRecurrenceExpressions;
    }

    if (input.entities.rawTopics) {
      entities.rawTopics = input.entities.rawTopics;
    }

    if (input.entities.rawPeople) {
      entities.rawPeople = input.entities.rawPeople;
    }

    if (input.entities.rawLocations) {
      entities.rawLocations = input.entities.rawLocations;
    }
  }

  if (input.memory) {
    if (input.memory.usedProfileFields) {
      memory.usedProfileFields = input.memory.usedProfileFields;
    }

    if (input.memory.usedStateFields) {
      memory.usedStateFields = input.memory.usedStateFields;
    }

    if (input.memory.pendingStateDetected !== undefined) {
      memory.pendingStateDetected = input.memory.pendingStateDetected;
    }
  }

  if (input.routing) {
    if (input.routing.targetModule) {
      routing.targetModule = input.routing.targetModule;
    }

    if (input.routing.targetAction) {
      routing.targetAction = input.routing.targetAction;
    }
  }

  let rewrittenUserText = input.rawUserText;

  if (input.rewrittenUserText) {
    rewrittenUserText = input.rewrittenUserText;
  }

  let data: Record<string, unknown> = {};

  if (input.data) {
    data = input.data;
  }

  let missingFields: string[] = [];

  if (input.missingFields) {
    missingFields = input.missingFields;
  }

  const packet: IntakePacket = {
    rawUserText: input.rawUserText,
    rewrittenUserText,
    session: input.session,
    understanding: input.understanding,
    entities,
    data,
    missingFields,
    feedback: input.feedback || null,
    memory,
    routing
  };

  return packet;
}
