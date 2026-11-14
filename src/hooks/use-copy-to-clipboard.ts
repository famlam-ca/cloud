import * as React from "react"

export function useCopyToClipboard({
  onCopy,
  timeout = 2000,
}: {
  onCopy?: () => void
  timeout?: number
} = {}) {
  const [isCopied, setIsCopied] = React.useState(false)

  async function copyToClipboard(value: string) {
    if (typeof window === "undefined") return false
    if (!value) return false

    let hasCopied = false

    await navigator.clipboard.writeText(value)
    hasCopied = true

    if (!hasCopied) return false

    setIsCopied(true)

    if (onCopy) onCopy()

    if (timeout !== 0) {
      setTimeout(() => {
        setIsCopied(false)
      }, timeout)
    }

    return true
  }

  return { copyToClipboard, isCopied }
}
