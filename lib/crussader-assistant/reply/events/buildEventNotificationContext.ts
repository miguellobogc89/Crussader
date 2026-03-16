// lib/crussader-assistant/reply/events/buildEventNotificationContext.ts
export function buildEventNotificationContext(args: {
  title?: string | null
  prompt?: string | null
  customerFirstName?: string | null
}) {

  const title = String(args.title || "").trim()
  const prompt = String(args.prompt || "").trim()

  const reminderText = prompt || title

  const userName =
    args.customerFirstName && String(args.customerFirstName).trim()
      ? String(args.customerFirstName).trim()
      : null

  return {
    reminderText,
    userName
  }
}