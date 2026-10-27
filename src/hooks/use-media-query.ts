import * as React from "react"

function useMediaQuery(query: string): boolean {
  const [value, setValue] = React.useState(false)

  React.useEffect(() => {
    function onChange(event: MediaQueryListEvent) {
      setValue(event.matches)
    }

    const result = matchMedia(query)
    result.addEventListener("change", onChange)
    setValue(result.matches)

    return () => result.removeEventListener("change", onChange)
  }, [query])

  return value
}

const BREAKPOINTS = {
  "2xl": 1536,
  lg: 1024,
  md: 768,
  sm: 640,
  xl: 1280,
} as const

export type Breakpoint = keyof typeof BREAKPOINTS

export function useIsBreakpoint(
  breakpoint: Breakpoint | number = "md",
): boolean {
  const px =
    typeof breakpoint === "number" ? breakpoint : BREAKPOINTS[breakpoint]
  return useMediaQuery(`(max-width: ${px - 1}px)`)
}
