// app/components/ui/spinner.tsx
"use client";
import { Grid } from "ldrs/react";
import "ldrs/react/Grid.css";

export function Spinner({
  size = 20,
  speed = 1.2,
  color = "hsl(var(--foreground))",
}: { size?: number; speed?: number; color?: string }) {
  return <Grid size={size} speed={speed} color={color} />;
}

