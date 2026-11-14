import type * as React from "react"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type HintProps = React.ComponentProps<typeof TooltipTrigger> &
  React.ComponentProps<typeof TooltipContent> & {
    label: string
  }

export function Hint({ children, label, render, ...props }: HintProps) {
  return (
    <Tooltip>
      {render ? (
        <TooltipTrigger render={render} />
      ) : (
        <TooltipTrigger>{children}</TooltipTrigger>
      )}
      <TooltipContent {...props}>
        <p className="font-semibold">{label}</p>
      </TooltipContent>
    </Tooltip>
  )
}
