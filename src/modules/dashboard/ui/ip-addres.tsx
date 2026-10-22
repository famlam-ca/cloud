import { IconCheck, IconCopy } from "@tabler/icons-react"
import { cn } from "cn"
import { GlobeIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { useRevealOnClick } from "@/hooks/use-reveal-on-click"

interface IPAddressProps {
  ipAddress: string
  direction?: "ltr" | "rtl"
  showGlobe?: boolean
}

export function IPAddress({
  ipAddress,
  direction = "ltr",
  showGlobe = true,
}: IPAddressProps) {
  const { isCopied, copyToClipboard } = useCopyToClipboard()
  const { isRevealed, handleReveal, getDisplayText } = useRevealOnClick()

  return (
    <div className="group/ipAddress flex items-center gap-2">
      {showGlobe && (
        <GlobeIcon
          className={cn(
            "size-4 stroke-primary group-hover/ipAddress:hidden",
            isRevealed && "hidden",
            isCopied && "hidden",
            direction === "ltr" ? "order-1" : "order-2",
          )}
        />
      )}
      <Button
        className={cn(
          "hidden w-4 group-hover/ipAddress:inline-flex",
          !showGlobe && "inline-flex! text-muted-foreground",
          isRevealed && "inline-flex",
          isCopied && "inline-flex",
          direction === "ltr" ? "order-1" : "order-2",
        )}
        onClick={() => copyToClipboard(ipAddress)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            copyToClipboard(ipAddress)
          }
        }}
        size="icon-sm"
        variant="ghost"
      >
        {isCopied ? <IconCheck className="text-green-500" /> : <IconCopy />}
        <span className="sr-only">Copy to clipboard</span>
      </Button>
      <Button
        className={cn(
          "bg-transparent! px-0 active:not-aria-[haspopup]:translate-y-0",
          direction === "ltr" ? "order-2" : "order-1",
        )}
        onClick={handleReveal}
        size="sm"
        variant="ghost"
      >
        <span className="font-mono">{getDisplayText(ipAddress)}</span>
      </Button>
    </div>
  )
}
