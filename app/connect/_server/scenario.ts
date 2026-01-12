// app/connect/_server/scenario.ts
export type ConnectScenario =
  | "OAUTH_ERROR"
  | "NO_ACCOUNTS"
  | "PICKED_ACCOUNT_MISSING_NAME"
  | "LOCATIONS_LIST_FAILED"
  | "NO_LOCATIONS"
  | "HAS_LOCATIONS"
  | "MULTI_ACCOUNTS";

export function computeScenario(args: {
  oauthError?: string | null;
  accountsCount: number;
  pickedAccountOk: boolean;
  locationsListOk: boolean;
  locationsCount: number;
}) {
  const { oauthError, accountsCount, pickedAccountOk, locationsListOk, locationsCount } = args;

  if (oauthError) return "OAUTH_ERROR" as const;

  if (accountsCount === 0) return "NO_ACCOUNTS" as const;

  if (!pickedAccountOk) return "PICKED_ACCOUNT_MISSING_NAME" as const;

  if (!locationsListOk) return "LOCATIONS_LIST_FAILED" as const;

  if (locationsCount === 0) return "NO_LOCATIONS" as const;

  if (accountsCount > 1) return "MULTI_ACCOUNTS" as const;

  return "HAS_LOCATIONS" as const;
}
