// lib/slots/slot-recovery/types.ts

export type WaStatusItem = {
  id?: string;
  status?: string;
  timestamp?: string;
  recipient_id?: string;
  errors?: Array<{
    code?: number;
    title?: string;
    message?: string;
    error_data?: unknown;
  }>;
};

export type WaMessageItem = {
  id?: string;
  from?: string;
  timestamp?: string;
  type?: string;
  text?: {
    body?: string;
  };
  button?: {
    text?: string;
    payload?: string;
  };
  interactive?: {
    type?: string;
    button_reply?: {
      id?: string;
      title?: string;
    };
    list_reply?: {
      id?: string;
      title?: string;
      description?: string;
    };
  };
  context?: {
    id?: string;
    from?: string;
  };
};

export type WaValue = {
  statuses?: WaStatusItem[];
  messages?: WaMessageItem[];

  contacts?: {
    profile?: {
      name?: string;
    };
    wa_id?: string;
  }[];

  metadata?: {
    display_phone_number?: string;
    phone_number_id?: string;
  };
};