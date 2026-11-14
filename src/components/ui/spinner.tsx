import { IconLoader } from "@tabler/icons-react"
import { cn } from "cn"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <output aria-label="Loading" data-slot="spinner">
      <IconLoader className={cn("size-4 animate-spin", className)} {...props} />
    </output>
  )
}

export { Spinner }
