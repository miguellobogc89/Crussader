import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          // BASE
          "flex h-9 w-full rounded-lg border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-150",

          // BORDER NORMAL
          "border-border",

          // HOVER (muy sutil)
          "hover:border-slate-300",

          // FOCUS (aquí está la clave)
          "focus:outline-none focus:border-blue-500",

          // SIN RINGS
          "ring-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0",

          // DISABLED
          "disabled:cursor-not-allowed disabled:opacity-50",

          className
        )}
        {...props}
      />
    )
  }
)

Input.displayName = "Input"

export { Input }