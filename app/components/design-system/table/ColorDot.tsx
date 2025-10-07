import * as React from "react";

export default function ColorDot({ color }: { color?: string | null }) {
  return (
    <span
      className="inline-block h-3.5 w-3.5 rounded-full border align-middle"
      style={{
        backgroundColor: color || "transparent",
        borderColor: color ? "transparent" : "var(--muted-foreground)",
      }}
      title={color || "sin color"}
    />
  );
}
