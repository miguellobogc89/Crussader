// app/components/admin/integrations/whatsapp/IncomingMessageBubble.tsx
"use client";

export default function IncomingMessageBubble({
  text,
  time,
}: {
  text: string;
  time: string;
}) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[78%] rounded-2xl border bg-background px-3 py-2 shadow-sm">
        <div className="whitespace-pre-wrap text-sm leading-relaxed">{text}</div>
        <div className="mt-1 text-right text-[11px] text-muted-foreground">{time}</div>
      </div>
    </div>
  );
}