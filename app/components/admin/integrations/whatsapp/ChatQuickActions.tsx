// app/components/admin/integrations/whatsapp/ChatQuickActions.tsx
"use client";

import { useMemo } from "react";
import { QUICK_ACTIONS, type TemplateGroupKey } from "@/lib/whatsapp/templateGroups";

type DefaultTemplate = {
  id: string;
  template_name: string;
  title: string;
  body_preview: string | null;
  language: string;
  category: string;
  use_type: string;
  status: string;
  is_favorite: boolean;
  updated_at: string;
};

export default function ChatQuickActions({
  defaults,
  disabled,
  onInsertTemplate,
}: {
  defaults: Record<string, DefaultTemplate | null>;
  disabled?: boolean;
  onInsertTemplate: (groupKey: TemplateGroupKey, text: string) => void;
}) {
  const actions = useMemo(() => QUICK_ACTIONS, []);

  return (
    <div className="border-b bg-background px-3 h-12 flex items-center">
      <div className="flex w-full items-center gap-2 overflow-x-auto">
        {actions.map((a) => {
          const tpl = defaults ? (defaults[a.key] as DefaultTemplate | null) : null;
          const can = Boolean(tpl && tpl.body_preview && tpl.body_preview.trim().length > 0);

          return (
            <button
              key={a.key}
              type="button"
              disabled={Boolean(disabled) || !can}
              onClick={() => {
                if (!tpl) return;
                const text = tpl.body_preview ? tpl.body_preview : "";
                onInsertTemplate(a.key, text);
              }}
              title={tpl ? tpl.title : "Sin plantilla"}
              className={[
                "shrink-0",
                "h-8 px-4",
                "rounded-full border",
                "text-xs font-medium",
                "bg-white",
                "border-muted-foreground/40",
                "text-foreground",
                "transition",
                "hover:bg-muted/30",
                "active:bg-muted/60 active:scale-[0.98]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:active:bg-white disabled:active:scale-100",
              ].join(" ")}
            >
              {a.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}