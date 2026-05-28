// app/components/whatsapp/IncomingMessageBubble.tsx
"use client";

function renderWhatsAppText(text: string) {
  const parts = text.split(/(\*[^*]+\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <strong key={index}>{part.slice(1, -1)}</strong>;
    }

    return <span key={index}>{part}</span>;
  });
}

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
        <div className="whitespace-pre-wrap text-sm leading-relaxed">{renderWhatsAppText(text)}</div>
        <div className="mt-1 text-right text-[11px] text-muted-foreground">{time}</div>
      </div>
    </div>
  );
}