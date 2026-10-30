"use client"

import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { cn } from "cn"

function Switch({
  className,
  size = "default",
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: "sm" | "default" | "lg"
}) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "peer group/switch focus-visible:border-ring focus-visible:ring-ring/30 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-checked:border-primary data-unchecked:border-input/50 data-checked:bg-primary data-unchecked:bg-input group-has-focus-visible/field-label:data-checked:border-primary group-has-focus-visible/field-label:data-unchecked:border-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 relative inline-flex shrink-0 items-center rounded-none border transition-all outline-none group-has-focus-visible/field-label:ring-0 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:ring-2 aria-invalid:ring-2 data-disabled:cursor-not-allowed data-disabled:opacity-50 data-[size=default]:h-4.5 data-[size=default]:w-8.25 data-[size=lg]:h-9 data-[size=lg]:w-18 data-[size=sm]:h-3.5 data-[size=sm]:w-6.25",
        className,
      )}
      data-size={size}
      data-slot="switch"
      {...props}
    >
      <SwitchPrimitive.Thumb
        className="bg-background dark:data-checked:bg-primary-foreground dark:data-unchecked:bg-foreground pointer-events-none block ring-0 transition-transform group-data-[size=default]/switch:size-3.5 group-data-[size=lg]/switch:size-7 group-data-[size=sm]/switch:size-2.5 data-checked:translate-x-[calc(100%+2px)] group-data-[size=lg]/switch:data-checked:translate-x-[calc(100%+0.75rem)] data-unchecked:translate-x-px group-data-[size=lg]/switch:data-unchecked:translate-x-1"
        data-slot="switch-thumb"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
