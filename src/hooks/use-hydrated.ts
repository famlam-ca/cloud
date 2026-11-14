import * as React from "react"

export function useHydrated() {
  const [isHydrated, setIsHydrated] = React.useState(false)

  React.useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    setIsHydrated(true)
  }, [])

  return isHydrated
}
