// lib/crussader-assistant/memory/mergePendingIntentData.ts

import { PendingIntent } from "./sessionMemoryTypes";
import { TranslatorResult } from "@/lib/crussader-assistant/legacy/bridges/translator/types";

type MergePendingIntentDataArgs = {
  currentPendingIntent: PendingIntent | null;
  translatedIntent: TranslatorResult;
};

function asCleanString(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function isGenericEventName(value: unknown): boolean {
  const text = asCleanString(value).toLowerCase();

  if (!text) {
    return true;
  }

  const blockedValues = [
    "crear un recordatorio",
    "crear recordatorio",
    "un recordatorio",
    "recordatorio",
    "crear un evento",
    "crear evento",
    "un evento",
    "evento",
    "crear un evento para recordarme una cosa",
    "recordarme una cosa",
    "recordar una cosa",
    "una cosa"
  ];

  if (blockedValues.includes(text)) {
    return true;
  }

  if (text.startsWith("crear un evento para recordarme")) {
    return true;
  }

  if (text.startsWith("crear un recordatorio para recordarme")) {
    return true;
  }

  return false;
}

function cleanupEventNameCandidate(value: unknown): string {
  let text = asCleanString(value);

  if (!text) {
    return "";
  }

  text = text.replace(/^crear (un )?(evento|recordatorio)( para)?/i, "").trim();

  text = text.replace(
    /\s+(mañana|pasado mañana|hoy|el lunes|el martes|el miércoles|el jueves|el viernes|el sábado|el domingo)$/i,
    ""
  ).trim();

  text = text.replace(/\s+a las\s+.+$/i, "").trim();
  text = text.replace(/\s{2,}/g, " ").trim();

  return text;
}

function buildEventNameFromTranslatedData(
  data: Record<string, unknown>,
  rewrittenUserText: string
): string {
  const title = cleanupEventNameCandidate(data.title);
  if (title && !isGenericEventName(title)) {
    return title;
  }

  const explicitEventName = cleanupEventNameCandidate(data.eventName);
  if (explicitEventName && !isGenericEventName(explicitEventName)) {
    return explicitEventName;
  }

  const rewritten = cleanupEventNameCandidate(rewrittenUserText);
  if (rewritten && !isGenericEventName(rewritten)) {
    return rewritten;
  }

  return "";
}

function normalizeCollectedData(
  data: Record<string, unknown>,
  translatedIntent: TranslatorResult
): Record<string, unknown> {
  const nextData = { ...data };

  const day = asCleanString(nextData.day);
  const date = asCleanString(nextData.date);

  if (day && !date) {
    nextData.date = day;
  }

  const description = asCleanString(nextData.description);
  const recurrence = asCleanString(nextData.recurrence);

  if (
    description &&
    (!asCleanString(nextData.eventName) || isGenericEventName(nextData.eventName))
  ) {
    nextData.eventName = description;
  }

  if (recurrence === "daily" && !nextData.days) {
    nextData.days = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday"
    ];
  }

  const normalizedEventName = buildEventNameFromTranslatedData(
    nextData,
    asCleanString(translatedIntent.rewrittenUserText)
  );

  const currentEventName = asCleanString(nextData.eventName);

  if (
    normalizedEventName &&
    (!currentEventName || isGenericEventName(currentEventName))
  ) {
    nextData.eventName = normalizedEventName;
  }

  return nextData;
}

function buildCreateEventMissingFields(collectedData: Record<string, unknown>) {
  const missingFields: string[] = [];

  const eventName = collectedData.eventName;
  const date = collectedData.date;
  const time = collectedData.time;
  const recurrence = collectedData.recurrence;
  const days = collectedData.days;

  let hasSchedule = false;

  if (typeof date === "string" && date.trim()) {
    hasSchedule = true;
  }

  if (typeof recurrence === "string" && recurrence.trim()) {
    hasSchedule = true;
  }

  if (Array.isArray(days) && days.length > 0) {
    hasSchedule = true;
  }

  if (typeof eventName !== "string" || !eventName.trim()) {
    missingFields.push("eventName");
  }

  if (!hasSchedule) {
    missingFields.push("date");
  }

  if (typeof time !== "string" || !time.trim()) {
    missingFields.push("time");
  }

  return missingFields;
}

function isCreateEventIntent(
  requestedInstruction: string | null,
  product: string | null
) {
  if (product !== "EVENT") {
    return false;
  }

  if (requestedInstruction === "CREATE_EVENT") {
    return true;
  }

  if (requestedInstruction === "CREATE") {
    return true;
  }

  return false;
}

function resolveMissingFields(
  requestedInstruction: string | null,
  product: string | null,
  collectedData: Record<string, unknown>,
  translatedIntent: TranslatorResult
) {
  if (isCreateEventIntent(requestedInstruction, product)) {
    return buildCreateEventMissingFields(collectedData);
  }

  const translatedMissingFields = translatedIntent.missingFields;

  if (translatedMissingFields.length > 0) {
    return [...translatedMissingFields];
  }

  return [];
}

function resolveStatus(missingFields: string[]) {
  if (missingFields.length > 0) {
    return "WAITING_FOR_DATA" as const;
  }

  return "READY" as const;
}

function hasExplicitIntent(translatedIntent: TranslatorResult) {
  if (translatedIntent.requestedInstruction) {
    return true;
  }

  if (translatedIntent.action) {
    return true;
  }

  if (translatedIntent.product) {
    return true;
  }

  if (translatedIntent.subtype) {
    return true;
  }

  return false;
}

function isSameIntent(
  currentPendingIntent: PendingIntent | null,
  translatedIntent: TranslatorResult
) {
  if (!currentPendingIntent) {
    return false;
  }

  const nextRequestedInstruction =
    translatedIntent.requestedInstruction || currentPendingIntent.requestedInstruction;
  const nextAction =
    translatedIntent.action || currentPendingIntent.action;
  const nextProduct =
    translatedIntent.product || currentPendingIntent.product;
  const nextSubtype =
    translatedIntent.subtype || currentPendingIntent.subtype;

  if (nextRequestedInstruction !== currentPendingIntent.requestedInstruction) {
    return false;
  }

  if (nextAction !== currentPendingIntent.action) {
    return false;
  }

  if (nextProduct !== currentPendingIntent.product) {
    return false;
  }

  if (nextSubtype !== currentPendingIntent.subtype) {
    return false;
  }

  return true;
}

function shouldPreserveCurrentIntent(
  currentPendingIntent: PendingIntent | null,
  translatedIntent: TranslatorResult
) {
  if (!currentPendingIntent) {
    return false;
  }

  if (currentPendingIntent.status !== "WAITING_FOR_DATA") {
    return false;
  }

  if (!hasExplicitIntent(translatedIntent)) {
    return true;
  }

  if (isSameIntent(currentPendingIntent, translatedIntent)) {
    return true;
  }

  return false;
}

function shouldResetCollectedData(
  currentPendingIntent: PendingIntent | null,
  translatedIntent: TranslatorResult
) {
  if (!currentPendingIntent) {
    return false;
  }

  if (!hasExplicitIntent(translatedIntent)) {
    return false;
  }

  if (isSameIntent(currentPendingIntent, translatedIntent)) {
    return false;
  }

  return true;
}

export function mergePendingIntentData(
  args: MergePendingIntentDataArgs
): PendingIntent | null {
  const currentPendingIntent = args.currentPendingIntent;
  const translatedIntent = args.translatedIntent;

  const hasIntent =
    !!translatedIntent.requestedInstruction ||
    !!translatedIntent.action ||
    !!translatedIntent.product ||
    !!translatedIntent.subtype;

  const hasData =
    !!translatedIntent.data &&
    Object.keys(translatedIntent.data).length > 0;

  if (!hasIntent && !hasData) {
    if (currentPendingIntent && currentPendingIntent.status === "WAITING_FOR_DATA") {
      return currentPendingIntent;
    }

    return null;
  }

  let requestedInstruction: string | null = null;
  let action: string | null = null;
  let product: string | null = null;
  let subtype: string | null = null;
  let collectedData: Record<string, unknown> = {};

  if (currentPendingIntent) {
    requestedInstruction = currentPendingIntent.requestedInstruction;
    action = currentPendingIntent.action;
    product = currentPendingIntent.product;
    subtype = currentPendingIntent.subtype;
    collectedData = { ...currentPendingIntent.collectedData };
  }

  const preserveCurrentIntent = shouldPreserveCurrentIntent(
    currentPendingIntent,
    translatedIntent
  );

  if (shouldResetCollectedData(currentPendingIntent, translatedIntent)) {
    collectedData = {};
  }

  if (!preserveCurrentIntent) {
    if (translatedIntent.requestedInstruction) {
      requestedInstruction = translatedIntent.requestedInstruction;
    }

    if (translatedIntent.action) {
      action = translatedIntent.action;
    }

    if (translatedIntent.product) {
      product = translatedIntent.product;
    }

    if (translatedIntent.subtype) {
      subtype = translatedIntent.subtype;
    }
  }

  if (hasData) {
    collectedData = {
      ...collectedData,
      ...translatedIntent.data
    };
  }

  if (isCreateEventIntent(requestedInstruction, product)) {
    collectedData = normalizeCollectedData(collectedData, translatedIntent);
  }

  if (!requestedInstruction && !action && !product && !subtype) {
    return currentPendingIntent;
  }

  const missingFields = resolveMissingFields(
    requestedInstruction,
    product,
    collectedData,
    translatedIntent
  );

  const status = resolveStatus(missingFields);

  return {
    requestedInstruction,
    action,
    product,
    subtype,
    status,
    collectedData,
    missingFields
  };
}