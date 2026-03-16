// lib/crussader-assistant/pipeline/routers/executeAssistantAction.ts

export type ExecuteAssistantActionInput = {
  requestedInstruction?: string | null;
  action?: string | null;
  product?: string | null;
  subtype?: string | null;
  collectedData: Record<string, unknown>;
};

export type ExecuteAssistantActionResult = {
  ok: boolean;
  executionType: "MOCK";
  route:
    | "CREATE_EVENT"
    | "QUERY_INFORMATION"
    | "GET_NEWS"
    | "GET_GOSPEL"
    | "UNKNOWN_ACTION";
  message: string | null;
  payload: Record<string, unknown>;
};

export async function executeAssistantAction(
  input: ExecuteAssistantActionInput
): Promise<ExecuteAssistantActionResult> {
  const requestedInstruction = String(input.requestedInstruction || "").trim();
  const action = String(input.action || "").trim();
  const product = String(input.product || "").trim();
  const subtype = String(input.subtype || "").trim();

  if (
    requestedInstruction === "CREATE_EVENT" ||
    (action === "CREATE" && product === "EVENT")
  ) {
    return {
      ok: true,
      executionType: "MOCK",
      route: "CREATE_EVENT",
      message: null,
      payload: {
        requestedInstruction,
        action,
        product,
        subtype,
        collectedData: input.collectedData
      }
    };
  }

  if (
    requestedInstruction === "QUERY_INFORMATION" ||
    (action === "QUERY" && product === "INFORMATION")
  ) {
    return {
      ok: true,
      executionType: "MOCK",
      route: "QUERY_INFORMATION",
      message: null,
      payload: {
        requestedInstruction,
        action,
        product,
        subtype,
        collectedData: input.collectedData
      }
    };
  }

  if (requestedInstruction === "GET_NEWS") {
    return {
      ok: true,
      executionType: "MOCK",
      route: "GET_NEWS",
      message: null,
      payload: {
        requestedInstruction,
        action,
        product,
        subtype,
        collectedData: input.collectedData
      }
    };
  }

  if (requestedInstruction === "GET_GOSPEL") {
    return {
      ok: true,
      executionType: "MOCK",
      route: "GET_GOSPEL",
      message: null,
      payload: {
        requestedInstruction,
        action,
        product,
        subtype,
        collectedData: input.collectedData
      }
    };
  }

  return {
    ok: false,
    executionType: "MOCK",
    route: "UNKNOWN_ACTION",
    message: null,
    payload: {
      requestedInstruction,
      action,
      product,
      subtype,
      collectedData: input.collectedData
    }
  };
}