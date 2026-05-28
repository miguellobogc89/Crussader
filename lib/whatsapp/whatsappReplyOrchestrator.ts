// lib/whatsapp/whatsappReplyOrchestrator.ts

import { buildWhatsappPipelineContext } from "./pipeline/buildWhatsappPipelineContext";
import { executeWhatsappIntent } from "./pipeline/executeWhatsappIntent";
import { logIncomingWhatsappMessage } from "./inbound/logIncomingWhatsappMessage";
import { sendAndLogWhatsappMessage } from "./outbound/sendAndLogWhatsappMessage";

type Params = {
  message: any;
};

export async function whatsappReplyOrchestrator({ message }: Params) {
  const ctx = await buildWhatsappPipelineContext({ message });

  await logIncomingWhatsappMessage({
    conversationId: ctx.conversationId,
    message: ctx.parsedMessage,
  });

  const executionResult = await executeWhatsappIntent(ctx);

  if (executionResult.type !== "SEND_TEXT") {
    return;
  }

  if (!ctx.conversationId) {
    return;
  }

  await sendAndLogWhatsappMessage({
    to: ctx.parsedMessage.fromPhone,
    conversationId: ctx.conversationId,
    text: executionResult.text,
  });
}